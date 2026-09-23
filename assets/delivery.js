let fullLicenseKey = '';
let attempts = 0;
const maxAttempts = 15;
function showState(name) {
  for (const state of ['loading', 'loaded', 'donation', 'error']) {
    document.getElementById('state-' + state).style.display = state === name ? 'block' : 'none';
  }
}
function fitKey() {
  const input = document.getElementById('key-input');
  if (!fullLicenseKey) return;
  input.style.height = 'auto';
  input.style.height = (input.scrollHeight + 4) + 'px';
}
function pending(message) {
  document.getElementById('page-title').textContent = 'License delivery pending';
  document.getElementById('page-subtitle').textContent = 'Your checkout result could not be confirmed yet.';
  document.getElementById('error-message').textContent = message;
  showState('error');
}
async function fetchKey() {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (!sessionId) {
    pending('No checkout session was supplied. Open the confirmation link from Stripe or check your delivery email. Contact Discord support if you need help.');
    return;
  }
  attempts++;
  try {
    const url = 'https://qmbpfmgmpcjwzujlzybz.supabase.co/functions/v1/stripe-webhook?session_id=' + encodeURIComponent(sessionId) + '&t=' + Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response, data;
    try { response = await fetch(url, { signal: controller.signal, cache: 'no-store' }); data = await response.json(); }
    finally { clearTimeout(timeout); }
    if (response.ok && data.found) {
      if (data.is_donation) {
        document.getElementById('page-title').textContent = 'Thank you for your support!';
        document.getElementById('page-subtitle').textContent = 'Your contribution helps keep MarineoClash moving forward.';
        document.getElementById('donation-donor-name').textContent = data.customer_name || 'Friend';
        if (Number.isFinite(Number(data.amount_cents))) document.getElementById('donation-amount').textContent = '$' + (Number(data.amount_cents) / 100).toFixed(2);
        showState('donation');
        return;
      }
      if (typeof data.license_key === 'string' && data.license_key.trim()) {
        fullLicenseKey = data.license_key;
        document.getElementById('key-input').value = fullLicenseKey;
        document.getElementById('customer-name').textContent = data.customer_name || 'Valued Customer';
        const lifetime = data.plan === 'lifetime';
        const planLabels = { monthly: '30-Day Pass', month: '30-Day Pass', '30_day': '30-Day Pass', quarterly: '90-Day Pass', '90_day': '90-Day Pass', lifetime: 'Lifetime' };
        const label = planLabels[data.plan] || 'Pro Access';
        document.getElementById('plan-name').textContent = 'MarineoClash Pro · ' + label;
        document.getElementById('plan-badge').textContent = lifetime ? 'Lifetime' : 'Pro';
        const expiry = new Date(data.expires_at);
        document.getElementById('expiry-date').textContent = lifetime ? 'Never expires' : data.expires_at && !Number.isNaN(expiry.getTime()) ? expiry.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'See your license email';
        document.getElementById('page-title').textContent = 'Your Pro key is ready.';
        document.getElementById('page-subtitle').textContent = 'Copy your full key, then activate it in MarineoClash.';
        showState('loaded');
        fitKey();
        return;
      }
    }
  } catch { /* Retry temporary network failures without exposing checkout data. */ }
  if (attempts < maxAttempts) setTimeout(fetchKey, 2000);
  else pending('Your key is not available yet. Check your delivery email or refresh to try again. If you completed payment, do not pay again; contact Discord support with your receipt.');
}
async function copyKey() {
  if (!fullLicenseKey) return;
  const label = document.getElementById('copy-text');
  try {
    await navigator.clipboard.writeText(fullLicenseKey);
    label.textContent = 'Full key copied!';
  } catch {
    const input = document.getElementById('key-input');
    input.focus(); input.select(); input.setSelectionRange(0, input.value.length);
    label.textContent = 'Key selected — copy manually';
  }
  setTimeout(() => { label.textContent = 'Copy full key'; }, 3500);
}
window.addEventListener('resize', fitKey);
if (document.fonts) document.fonts.ready.then(fitKey);
fetchKey();
