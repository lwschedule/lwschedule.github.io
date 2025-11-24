let packUpTime = parseInt(localStorage.getItem('pack-up-time') || '0', 10);
const input = document.getElementById('packUpTimeInput');

if (packUpTime > 0) {
  input.value = packUpTime;
}

document.querySelectorAll('.pack-up-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = parseInt(btn.dataset.value, 10);
    input.value = val > 0 ? val : '';
  });
});

input.addEventListener('change', () => {
  let val = parseInt(input.value, 10);
  if (isNaN(val) || val < 0) input.value = '';
  if (val > 30) input.value = 30;
});

document.getElementById('saveBtn').addEventListener('click', () => {
  let val = parseInt(input.value, 10);
  if (isNaN(val) || val < 0) val = 0;
  if (val > 30) val = 30;
  localStorage.setItem('pack-up-time', val);
  alert('Pack-up reminder saved!');
  location.href = '/settings';
});