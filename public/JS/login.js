const hideAlert1 = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const showAlert1 = (type, msg) => {
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert1, 5000);
};

//login form
const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      // alert('Logged In successfully!');
      showAlert1('success', 'Logged In successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 150);
    }
  } catch (err) {
    // alert(err.response.data.message);
    console.log('error');
    showAlert1('error', err.response.data.message);
  }
};

const form1 = document.querySelector('.form--login');
if (form1) {
  form1.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

// logout form
const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert1('error', 'Error logging out! try again.');
  }
};

const logOutButton = document.querySelector('.nav__el--logout');

if (logOutButton) {
  logOutButton.addEventListener('click', (el) => {
    console.log('logout');
    logout();
  });
}

const resetLink = async (email) => {
  console.log(email);
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgetpassword',
      data: {
        email,
      },
    });
    if (res.data.status === 'success') {
      // alert('Logged In successfully!');
      showAlert1('success', 'Send successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 150);
    }
  } catch (err) {
    // alert(err.response.data.message);
    console.log('error');
    showAlert1('error', err.response.data.message);
  }
};

const resetLinkForm = document.querySelector('.form--reset-link');
if (resetLinkForm) {
  resetLinkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    resetLink(email);
  });
}
