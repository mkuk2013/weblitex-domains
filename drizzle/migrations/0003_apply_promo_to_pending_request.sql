CREATE OR REPLACE FUNCTION public.apply_promo_to_pending_request(
  _request_id uuid,
  _user_id uuid,
  _code_hash text
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  promo_row public.promo_codes%ROWTYPE;
  request_row public.domain_requests%ROWTYPE;
BEGIN
  SELECT * INTO request_row
  FROM public.domain_requests
  WHERE id = _request_id AND user_id = _user_id
  FOR UPDATE;

  IF request_row.id IS NULL OR request_row.status <> 'awaiting_payment'::public.request_status THEN
    RETURN 'request_unavailable';
  END IF;

  SELECT * INTO promo_row
  FROM public.promo_codes
  WHERE code_hash = _code_hash
  FOR UPDATE;

  IF promo_row.id IS NULL
     OR promo_row.times_used >= promo_row.usage_limit
     OR (promo_row.expires_at IS NOT NULL AND promo_row.expires_at <= now()) THEN
    RETURN 'invalid_promo';
  END IF;

  UPDATE public.promo_codes
  SET times_used = times_used + 1
  WHERE id = promo_row.id;

  UPDATE public.domain_requests
  SET price_pkr = 0,
      promo_applied = true,
      payment_status = 'waived'::public.payment_status,
      status = 'review_pending'::public.request_status
  WHERE id = request_row.id;

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.apply_promo_to_pending_request(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_promo_to_pending_request(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.apply_promo_to_pending_request(uuid, uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_promo_to_pending_request(uuid, uuid, text) TO service_role;