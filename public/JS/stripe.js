const stripe = Stripe(
  'pk_test_51NFE3TSITN5PM06UIF4uaSAjxRIGeYJd475Cev13EFWTygRVafLrsJroF7O4s7tMAxPEv0sSaiN6GWrFZqFoygJT00bcV5ROUc'
);
const hideAlert2 = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const showAlert2 = (type, msg) => {
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert2, 5000);
};
const bookTour = async (tourId) => {
  try {
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);
    console.log(session);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);

    showAlert2('error', error.message);
  }
};

const bookButton = document.getElementById('book-tour');

if (bookButton)
  bookButton.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
