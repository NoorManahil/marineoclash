const menuButton = document.getElementById('menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu() { navigation.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => {
  navigation.hidden = !navigation.hidden;
  menuButton.setAttribute('aria-expanded', String(!navigation.hidden));
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !navigation.hidden) { closeMenu(); menuButton.focus(); } });
document.getElementById('play-video').addEventListener('click', () => {
  const frame = document.createElement('iframe');
  frame.className = 'video-frame';
  frame.src = 'https://www.youtube-nocookie.com/embed/cwbhibsoEoM?autoplay=1';
  frame.title = 'MarineoClash bot showcase';
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  document.getElementById('play-video').replaceWith(frame);
  frame.focus();
});
async function syncLiveGoalStats() {
  try {
    const response = await fetch('https://qmbpfmgmpcjwzujlzybz.supabase.co/functions/v1/goal-stats');
    if (!response.ok) throw new Error('Goal unavailable');
    const data = await response.json();
    const raised = Number(data.raised), percentage = Number(data.percentage), remaining = Number(data.remaining), target = Number(data.target), supporters = Number(data.supporters || 0);
    if (![raised, percentage, remaining, target, supporters].every(Number.isFinite)) throw new Error('Invalid goal data');
    const pct = Math.min(100, Math.max(0, percentage));
    document.getElementById('goal-raised-text').textContent = `$${Math.round(raised)} raised · ${supporters} supporters`;
    document.getElementById('goal-remaining-text').textContent = `$${Math.max(0, Math.round(remaining))} to go · $${target} goal`;
    document.getElementById('goal-progress-bar').style.width = `${pct}%`;
    document.getElementById('goal-progress').setAttribute('aria-valuenow', pct);
  } catch {
    document.getElementById('goal-raised-text').textContent = 'Live progress is temporarily unavailable.';
  }
}
syncLiveGoalStats();
