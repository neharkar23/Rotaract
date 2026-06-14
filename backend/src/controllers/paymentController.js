import { supabase } from '../config/supabase.js';

export const getMyDues = async (req, res, next) => {
  try {
    const { data: payments, error } = await supabase
      .from('hr_payments')
      .select('*')
      .eq('profile_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ payments });
  } catch (err) {
    next(err);
  }
};

export const submitPaymentProof = async (req, res, next) => {
  try {
    const { paymentId, transactionRef, screenshotUrl } = req.body;
    
    if (!transactionRef) {
      return res.status(400).json({ error: 'Transaction Reference ID is required' });
    }

    let existingPayment = null;
    if (paymentId) {
      const { data } = await supabase.from('hr_payments').select('id').eq('id', paymentId).eq('profile_id', req.user.id).single();
      existingPayment = data;
    } else {
      const { data } = await supabase.from('hr_payments').select('id').eq('profile_id', req.user.id).eq('status', 'UNPAID').maybeSingle();
      existingPayment = data;
    }

    let resultData, resultError;

    if (existingPayment) {
      const { data, error } = await supabase.from('hr_payments').update({
        status: 'PENDING_VERIFICATION',
        upi_transaction_ref: transactionRef,
        receipt_screenshot_url: screenshotUrl || null
      }).eq('id', existingPayment.id).select().single();
      resultData = data;
      resultError = error;
    } else {
      const { data, error } = await supabase.from('hr_payments').insert({
        profile_id: req.user.id,
        amount_due: 1500,
        status: 'PENDING_VERIFICATION',
        upi_transaction_ref: transactionRef,
        receipt_screenshot_url: screenshotUrl || null
      }).select().single();
      resultData = data;
      resultError = error;
    }

    if (resultError) throw resultError;
    
    res.status(200).json({ message: 'Payment proof submitted successfully', payment: resultData });
  } catch (err) {
    next(err);
  }
};

export const getPendingPayments = async (req, res, next) => {
  try {
    const { data: payments, error } = await supabase
      .from('hr_payments')
      .select('*, hr_profiles!profile_id(name, rotaract_id, email, avatar_url)')
      .eq('status', 'PENDING_VERIFICATION')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json({ pendingPayments: payments });
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, isApproved, rejectionRemarks } = req.body;

    if (!paymentId || isApproved === undefined) {
      return res.status(400).json({ error: 'paymentId and isApproved are required' });
    }

    // Fetch payment to get target profile ID for notification
    const { data: payment, error: fetchErr } = await supabase
      .from('hr_payments')
      .select('profile_id')
      .eq('id', paymentId)
      .single();

    if (fetchErr || !payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const status = isApproved ? 'PAID' : 'UNPAID';
    const amount_due = isApproved ? 0 : undefined;
    
    const updatePayload = {
      status,
      verified_by: req.user.id,
      verified_at: new Date().toISOString()
    };
    
    if (amount_due !== undefined) updatePayload.amount_due = amount_due;
    if (!isApproved) updatePayload.remarks = `Rejected: ${rejectionRemarks}`;

    const { data: updatedPayment, error: updateErr } = await supabase
      .from('hr_payments')
      .update(updatePayload)
      .eq('id', paymentId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Send Notification
    await supabase.from('hr_notifications').insert({
      profile_id: payment.profile_id,
      title: isApproved ? 'Membership Payment Approved' : 'Dues Receipt Rejected',
      content: isApproved 
        ? 'Treasurer verified your UPI transaction reference receipt. You are now fully active.'
        : `Rejection reason: "${rejectionRemarks}". Please re-upload screenshot receipt.`
    });

    res.status(200).json({ message: 'Payment verified', payment: updatedPayment });
  } catch (err) {
    next(err);
  }
};
