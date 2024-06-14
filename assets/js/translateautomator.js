document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');
    initTranslateButton();

    // Regularly check for the presence of the button and re-add if necessary
    setInterval(function () {
        initTranslateButton();
    }, 1000); // Check every second
});

let isTranslating = false;
let translateTimeouts = [];

function initTranslateButton() {
    var toolbar = document.querySelector('.loading-indicator-container');
    if (toolbar && !document.querySelector('.btn-translate')) {
        addTranslateButton(toolbar);
    } else {
        // If the button already exists, reattach the click event to handle button state
        var button = document.querySelector('.btn-translate');
        if (button) {
            button.removeEventListener('click', handleButtonClick);
            button.addEventListener('click', handleButtonClick);
        }
    }
}

function addTranslateButton(toolbar) {
    var button = document.createElement('button');
    button.innerHTML = 'Start Automatic translate if empty';
    button.className = 'btn btn-primary oc-icon-language btn-translate';
    button.addEventListener('click', handleButtonClick);

    toolbar.appendChild(button);
    console.log('Translate button added');
}

function handleButtonClick() {
    console.log('Translate button clicked');
    var button = this;
    if (isTranslating) {
        stopTranslating(button);
    } else {
        startTranslating(button);
    }
}

function startTranslating(button) {
    isTranslating = true;
    button.innerHTML = 'Stop translating...';
    handleTranslateButtonClick(button);
}

function stopTranslating(button) {
    isTranslating = false;
    button.innerHTML = 'Translate "from" to "to" if "to" is empty';
    translateTimeouts.forEach(clearTimeout);
    translateTimeouts = [];
}

function handleTranslateButtonClick(button) {
    console.log('handleTranslateButtonClick function called');
    var fromCells = document.querySelectorAll('td[data-column="from"]');
    var localeTo = document.querySelector('input[name="locale_to"]').value;

    var delay = 1000; // 1 second delay

    var translatableCells = [];

    // Filter out cells that need translation
    fromCells.forEach(function (fromCell) {
        var toCell = fromCell.parentNode.querySelector('td[data-column="to"]');
        if (toCell) {
            var toValue = toCell.querySelector('input[data-container="data-container"]').value;
            if (!toValue) {
                translatableCells.push({ fromCell: fromCell, toCell: toCell });
            }
        }
    });

    console.log('Translatable cells:', translatableCells);

    // Translate and save each cell
    translatableCells.forEach(function (cells, index) {
        let timeout = setTimeout(function () {
            if (!isTranslating) return; // Stop if translation was stopped
            var fromValue = cells.fromCell.querySelector('input[data-container="data-container"]').value;
            var key = cells.fromCell.parentNode.getAttribute('data-row');

            console.log('From value:', fromValue);
            console.log('Key:', key);

            if (key) {
                $.request('onTranslate', {
                    data: {
                        text: fromValue,
                        locale_to: localeTo
                    },
                    success: function(data) {
                        console.log('Translation response:', data);
                        var inputElement = cells.toCell.querySelector('input[data-container="data-container"]');
                        var divElement = cells.toCell.querySelector('div[data-view-container="data-view-container"]');
                        if (inputElement && divElement) {
                            inputElement.value = data.translatedText;
                            divElement.innerText = data.translatedText;

                            // Call function to save translated data
                            saveTranslatedData(fromValue, data.translatedText, localeTo, key);
                        }
                    },
                    error: function(error) {
                        console.error('Error translating text:', error);
                    }
                });
            }
        }, index * delay);
        translateTimeouts.push(timeout);
    });

    // Reset the button state and text when translation completes
    if (translatableCells.length > 0) {
        let lastTimeout = setTimeout(function () {
            stopTranslating(button);
        }, translatableCells.length * delay);
        translateTimeouts.push(lastTimeout);
    }
}

function saveTranslatedData(fromValue, toValue, localeTo, key) {
    var sessionKey = document.querySelector('input[name="_session_key"]').value;
    var token = document.querySelector('input[name="_token"]').value;

    var payload = {
        _session_key: sessionKey,
        _token: token,
        search: '',
        locale_to: localeTo,
        key: key,
        'recordData[from]': fromValue,
        'recordData[to]': toValue
    };

    $.request('onServerUpdateRecord', {
        data: payload,
        success: function(response) {
            console.log('Translation saved successfully:', response);
        },
        error: function(error) {
            console.error('Error saving translation:', error);
        }
    });
}
