console.log('Hello, world!');
document.addEventListener('DOMContentLoaded', function() {
    var lastPopupTime = localStorage.getItem('lastPopupTime');
    if (!lastPopupTime || (Date.now() - parseInt(lastPopupTime, 10)) > (24 * 60 * 60 * 1000)) {
        setTimeout(function() {
            var popup = document.getElementById('popup');
            popup.classList.add('active');
            localStorage.setItem('lastPopupTime', Date.now().toString());
        }, 3000);
    }
    
    var popup = document.getElementById('popup');
    popup.addEventListener('click', function() {
        popup.classList.remove('active');
    });
});