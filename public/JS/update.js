console.log('Hello');

const showAlert3 = (type, msg) => {
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert3, 5000);
};

const hideAlert3 = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};
const formData = document.querySelector('.form-user-data');
const formSettings = document.querySelector('.form-user-settings');
const updateData = async (data, type) => {
  const url =
    type === 'password'
      ? '/api/v1/users/updatepassword'
      : '/api/v1/users/updateMe';
  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert3('success', `${type.toUpperCase()} successfully updated!`);
    }
  } catch (err) {
    showAlert3('error', err.response.data.message);
  }
};
if (formData) {
  formData.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // const email = document.getElementById('email').value;
    // const name = document.getElementById('name').value;
    updateData(form, 'data');
  });
}

if (formSettings) {
  formSettings.addEventListener('submit', async (e) => {
    console.log('j');
    e.preventDefault();

    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;
    await updateData(
      { currentPassword, newPassword, newPasswordConfirm },
      'password'
    );
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
