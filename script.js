const menuIcon = document.querySelector('.menu-icon');
const navLinks = document.querySelector('.nav-links');
menuIcon.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});
function clearFields() {

    document.getElementById('pickup').value = '';
    document.getElementById('dropoff').value = '';
}
