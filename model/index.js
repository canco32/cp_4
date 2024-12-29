import NetworkApp from './modules/network-app.js'

console.log('ready');
document.addEventListener('DOMContentLoaded', () => {
    console.log('ready');

    const canvas = document.getElementById('canvas');
    const canvasContainer = document.getElementById('canvas-container');
    const addRouterButton = document.getElementById('add-router');
    const addWorkstationButton = document.getElementById('add-workstation');
    const addWireButton = document.getElementById('add-wire');
    const removeWireButton = document.getElementById('remove-wire');
    const removeObjectButton = document.getElementById('remove-object');
    const uploadButtonContainer = document.getElementById('upload-config');
    const downloadButton = document.getElementById('download-config');
    const transferButton = document.getElementById('transfer-data');
    const app = new NetworkApp(canvas, canvasContainer);

    addRouterButton.addEventListener('click', () => app.createElement('router'));
    addWorkstationButton.addEventListener('click', () => app.createElement('workstation'));
    addWireButton.addEventListener('click', () => app.createWireMode(addWireButton));
    removeWireButton.addEventListener('click', () => app.createRemoveWireMode(removeWireButton));
    removeObjectButton.addEventListener('click', () => app.createRemoveObjectMode(removeObjectButton));
    downloadButton.addEventListener('click', () => app.downloadConfig());
    transferButton.addEventListener('click', () => app.transferDataMenuOpen());
    document.getElementById('randomize').addEventListener('click', () => app.createRandomizedNetwork());

    const uploadButton = document.createElement('input');
    uploadButton.type = 'file';
    uploadButton.classList.add('hidden');
    uploadButton.accept = '.json';
    uploadButton.addEventListener('change', (event) => app.loadConfig(event));

    const uploadButtonLabel = document.createElement('button');
    uploadButtonLabel.innerText = 'Upload Configuration';
    uploadButtonLabel.classList.add('px-4', 'py-2', 'bg-green-500', 'text-white', 'rounded', 'shadow');
    uploadButtonLabel.addEventListener('click', () => uploadButton.click());

    uploadButtonContainer.appendChild(uploadButtonLabel);
    uploadButtonContainer.appendChild(uploadButton);

            // Функция для отслеживания появления кнопки
    function observeButtonCreation(app) {
        // Создаём экземпляр MutationObserver
        const observer = new MutationObserver((mutationsList, observer) => {
            // Для каждой мутации (изменения в DOM)
            mutationsList.forEach((mutation) => {
                // Проверяем, добавлен ли элемент с id "send-data-between"
                if (mutation.type === 'childList') {
                    const button = document.getElementById('send-data-between');
                    if (button) {
                        // Если кнопка появилась, добавляем обработчик события
                        button.addEventListener('click', () => handleSendData(app));
                        // Прекращаем наблюдение, если кнопку уже нашли
                        observer.disconnect();
                    }
                }
            });
        });

        // Настройки для отслеживания
        const config = { childList: true, subtree: true };

        // Наблюдаем за body (или другим элементом контейнера)
        observer.observe(document.body, config);
    }

    // Запускаем наблюдение за созданием кнопки
    observeButtonCreation(app);

    // Функция обработки нажатия кнопки
    function handleSendData(app) {
        const fromWorkstationId = document.querySelector('#from-workstation-select').value;
        const toWorkstationId = document.querySelector('#to-workstation-select').value;
        const dataSize = document.querySelector('#data-size').value;

        // Пример создания экземпляра и отправки пакета
        const packetTransfer = new PacketTransfer(app.getNetworkConfig());
        packetTransfer.transferDataWithProtocols(fromWorkstationId, toWorkstationId, dataSize);

        // Логика для отправки данных (например, проверка и симуляция передачи)
        if (!fromWorkstationId || !toWorkstationId) {
            alert('Please select both workstations.');
            return;
        }

        // Пример обработки отправки данных
        console.log(`Sending data from ${fromWorkstationId} to ${toWorkstationId} with size ${dataSize} MTU.`);
    }

});