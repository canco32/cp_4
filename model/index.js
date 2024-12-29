import NetworkApp from './modules/network-app.js'
import NetworkConfig from './modules/network-config.js'
import WireManager from './modules/wire-manager.js'
import SideMenu from './modules/sidemenu.js'
import PacketTransfer from './modules/packet-transfer.js'

document.addEventListener('DOMContentLoaded', () => {
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
    const config = new NetworkConfig();
    const menu = new SideMenu(document.body, config);
    const wire = new WireManager(canvas, menu);
    const app = new NetworkApp(canvas, canvasContainer, config, menu, wire);

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

    function observeButtonCreation(app) {
        const observer = new MutationObserver((mutationsList, observer) => {
            mutationsList.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const button = document.getElementById('send-data-between');
                    if (button) {
                        button.addEventListener('click', () => handleSendData(app));
                        observer.disconnect();
                    }
                }
            });
        });

        const config = { childList: true, subtree: true };

        observer.observe(document.body, config);
    }

    observeButtonCreation(app);

    function handleSendData(app) {
        const fromWorkstationId = document.querySelector('#from-workstation-select').value;
        const toWorkstationId = document.querySelector('#to-workstation-select').value;
        const dataSize = document.querySelector('#data-size').value;

        const packetTransfer = new PacketTransfer(app.getNetworkConfig());
        packetTransfer.transferDataWithProtocols(fromWorkstationId, toWorkstationId, dataSize);

        if (!fromWorkstationId || !toWorkstationId) {
            alert('Please select both workstations.');
            return;
        }

        console.log(`Sending data from ${fromWorkstationId} to ${toWorkstationId} with size ${dataSize} MTU.`);
    }

});