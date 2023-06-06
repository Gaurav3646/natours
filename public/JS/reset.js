const hideAlert4 = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const showAlert4 = (type, msg) => {
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert4, 5000);
};

// password reset form
const resetPassword = async (passwordConfirm, password) => {
  const token = document.getElementById('reset').dataset.tokenId;

  try {
    console.log(token);
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/resetpassword/${token}`,
      data: {
        passwordConfirm,
        password,
      },
    });
    console.log(res);
    if (res.data.status === 'success') {
      // alert('Logged In successfully!');
      showAlert4('success', 'Password reset successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 150);
    }
  } catch (err) {
    // alert(err.response.data.message);
    console.log('error');
    showAlert4('error', err.response.data.message);
  }
};

const resetForm = document.querySelector('.form--reset-password');
if (resetForm) {
  resetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const passwordConfirm = document.getElementById('password-confirm').value;
    const password = document.getElementById('password').value;
    console.log(password, passwordConfirm);
    resetPassword(passwordConfirm, password);
  });
}
