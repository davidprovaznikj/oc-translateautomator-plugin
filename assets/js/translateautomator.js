// Ensure the initialization of the button when content is loaded via AJAX or during normal page load
$(document).on('ajaxComplete ready', function () {
    // Get the full current URL
    const currentPath = window.location.href;

    // Check if the URL contains the target string
    if (currentPath.includes('/rainlab/translate/messages')) {
        console.log('URL contains "/rainlab/translate/messages". Initializing the button...');
        reinitializeTranslateButton();
    }
});

let isTranslating = false;
let translateTimeouts = [];

// Function to reinitialize the button
function reinitializeTranslateButton() {
    const toolbar = document.querySelector('.loading-indicator-container');

    // Verify if the toolbar exists
    if (toolbar && !toolbar.querySelector('.btn-translate')) {
        console.log('Button does not exist. Adding button...');
        addTranslateButton(toolbar); // Add the button
    } else if (toolbar) {
        console.log('Button already exists. Attaching event handler...');
        const button = toolbar.querySelector('.btn-translate');
        if (button) {
            // Ensure proper event settings
            button.removeEventListener('click', handleButtonClick);
            button.addEventListener('click', handleButtonClick);
        }
    } else {
        console.warn('Toolbar not found. Cannot add the button.');
    }
}

function initTranslateButton() {
    const toolbar = document.querySelector('.loading-indicator-container');
    if (toolbar && !toolbar.querySelector('.btn-translate')) {
        addTranslateButton(toolbar);
    } else {
        const button = document.querySelector('.btn-translate');
        if (button) {
            button.removeEventListener('click', handleButtonClick);
            button.addEventListener('click', handleButtonClick);
        }
    }
}

// Function to add the translate button
function addTranslateButton(toolbar) {
    const button = document.createElement('button');
    button.innerHTML = 'Translate "from" to "to" if "to" is empty';
    button.className = 'btn btn-primary oc-icon-language btn-translate';
    button.addEventListener('click', handleButtonClick);

    toolbar.appendChild(button);
    console.log('Translate button added');
}

function handleButtonClick() {
    console.log('Translate button clicked');
    const button = this;
    if (isTranslating) {
        stopTranslating(button);
    } else {
        startTranslating(button);
    }
}

// Start translation and update button state
function startTranslating(button) {
    isTranslating = true;
    button.innerHTML = 'Stop translating...';
    handleTranslateButtonClick(button);
}

// Stop translation and reset button state
function stopTranslating(button) {
    isTranslating = false;
    button.innerHTML = 'Translate "from" to "to" if "to" is empty';
    translateTimeouts.forEach(clearTimeout);
    translateTimeouts = [];
}

// Handle the translate button click
function handleTranslateButtonClick(button) {
    console.log('handleTranslateButtonClick function called');
    const fromCells = document.querySelectorAll('td[data-column="from"]');
    const localeTo = document.querySelector('input[name="locale_to"]').value;

    const delay = 1000; // 1 second delay

    const translatableCells = [];

    // Filter out cells that need translation
    fromCells.forEach(function (fromCell) {
        const toCell = fromCell.parentNode.querySelector('td[data-column="to"]');
        if (toCell) {
            const toValue = toCell.querySelector('input[data-container="data-container"]').value;
            if (!toValue) {
                translatableCells.push({fromCell: fromCell, toCell: toCell});
            }
        }
    });

    console.log('Translatable cells:', translatableCells);

    // Translate and save each cell
    translatableCells.forEach(function (cells, index) {
        const timeout = setTimeout(function () {
            if (!isTranslating) return; // Stop if translation was stopped
            const fromValue = cells.fromCell.querySelector('input[data-container="data-container"]').value;
            const key = cells.fromCell.parentNode.getAttribute('data-row');

            console.log('From value:', fromValue);
            console.log('Key:', key);

            if (key) {
                $.request('onTranslate', {
                    data: {
                        text: fromValue,
                        locale_to: localeTo
                    },
                    success: function (data) {
                        console.log('Translation response:', data);
                        const inputElement = cells.toCell.querySelector('input[data-container="data-container"]');
                        const divElement = cells.toCell.querySelector('div[data-view-container="data-view-container"]');
                        if (inputElement && divElement) {
                            inputElement.value = data.translatedText;
                            divElement.innerText = data.translatedText;

                            // Call function to save translated data
                            saveTranslatedData(fromValue, data.translatedText, localeTo, key);
                        }
                    },
                    error: function (error) {
                        console.error('Error translating text:', error);
                    }
                });
            }
        }, index * delay);
        translateTimeouts.push(timeout);
    });

    // Reset the button state and text when translation completes
    if (translatableCells.length > 0) {
        const lastTimeout = setTimeout(function () {
            stopTranslating(button);
        }, translatableCells.length * delay);
        translateTimeouts.push(lastTimeout);
    }
}

// Function to save the translated data
function saveTranslatedData(fromValue, toValue, localeTo, key) {
    const sessionKey = document.querySelector('input[name="_session_key"]').value;
    const token = document.querySelector('input[name="_token"]').value;

    const payload = {
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
        success: function (response) {
            console.log('Translation saved successfully:', response);
        },
        error: function (error) {
            console.error('Error saving translation:', error);
        }
    });
}
