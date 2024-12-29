export default class WireManager {
    constructor(canvas, menu) {
        this.canvas = canvas;
        this.weights = [3, 5, 6, 8, 10, 12, 17, 20, 25, 27];
        this.wires = [];
        this.sideMenu = menu;
    }

    isWireExisting(start, end) {
        return this.wires.some(wire => (wire.start === start && wire.end === end) || (wire.start === end && wire.end === start));
    }

    createWire(startElement, endElement, cableType, transmissionType, weight, objectStatus = 'on') {
        const wire = document.createElement('div');
        wire.classList.add('wire');
        wire.start = startElement;
        wire.end = endElement;


        wire.dataset.id = this.wires.length; 
        wire.dataset.channelType = cableType.toLowerCase(); 
        wire.dataset.transmissionType = transmissionType.toLowerCase();  
        wire.dataset.weight = weight; 
        wire.dataset.objectStatus = objectStatus;   

        wire.style.opacity = (objectStatus === 'off') ? '0.5' : '1';

        const label = document.createElement('div');
        label.classList.add('wire-label');
        wire.label = label;
        this.canvas.appendChild(label);

        this.updateWire(wire);
        this.canvas.appendChild(wire);
        this.wires.push(wire);

        const wireId = this.wires.length - 1;

        wire.addEventListener('dblclick', () => this.sideMenu.openMenu(wire));

        return {
            id: wireId,
            cableType: cableType,
            transmissionType: transmissionType,
            weight: weight,
            objectStatus: objectStatus
        };
    }

    updateWire(wire) {
        const startRect = wire.start.getBoundingClientRect();
        const endRect = wire.end.getBoundingClientRect();

        const canvasRect = this.canvas.getBoundingClientRect();

        const startX = startRect.left + startRect.width / 2 - canvasRect.left;
        const startY = startRect.top + startRect.height / 2 - canvasRect.top;
        const endX = endRect.left + endRect.width / 2 - canvasRect.left;
        const endY = endRect.top + endRect.height / 2 - canvasRect.top;

        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

        wire.style.width = `${length}px`;
        wire.style.transform = `rotate(${angle}deg)`;
        wire.style.transformOrigin = '0 0';
        wire.style.left = `${startX}px`;
        wire.style.top = `${startY}px`;

        const weight = this.getWeight(length, wire.dataset.channelType);
        wire.label.innerText = `${weight}`;

        wire.label.addEventListener('dblclick', () => this.sideMenu.openMenu(wire));

        const midX = (startX + endX) / 2 + 10;
        const midY = (startY + endY) / 2 - 15;

        const offsetX = 15;
        const offsetY = 0;

        wire.label.style.left = `${midX + offsetX}px`;
        wire.label.style.top = `${midY + offsetY}px`;
    }

    getWeight(length, channelType) {
        if (channelType === 'satellite') {
            if (length < 100) return this.weights[6]; 
            if (length < 150) return this.weights[7];
            if (length < 200) return this.weights[8];
            return this.weights[9]; 
        }

        if (length < 100) return this.weights[0];
        if (length < 150) return this.weights[1];
        if (length < 200) return this.weights[2];
        if (length < 300) return this.weights[3];
        if (length < 400) return this.weights[4];
        if (length < 500) return this.weights[5];
        if (length < 600) return this.weights[6];
        if (length < 700) return this.weights[7];
        if (length < 800) return this.weights[8];
        return this.weights[9];
    }


    removeWire(wire) {
        this.canvas.removeChild(wire);
        this.canvas.removeChild(wire.label);
        const index = this.wires.indexOf(wire);
        if (index > -1) {
            this.wires.splice(index, 1);
        }
    }
}