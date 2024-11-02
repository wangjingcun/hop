console.log(Array.from(document.querySelectorAll('.transferId a'))
    .map(element => element.getAttribute('data-clipboard-text'))
    .join(','));
