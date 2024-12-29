export default class NetworkConfig {
    constructor() {
        this.objects = [];
        this.wires = [];
    }

    addObject(type, x, y, uniqueId, objectStatus) {
        this.objects.push({
            type: type,
            x: x,
            y: y,
            id: uniqueId,
            objectStatus: objectStatus  
        });
    }

    addWire(wire) {
        this.wires.push(wire);
    }

    exportToJSON() {
        return JSON.stringify({
            objects: this.objects,
            wires: this.wires
        }, null, 2);
    }

    static importFromJSON(jsonData) {
        const data = JSON.parse(jsonData);
        const config = new NetworkConfig();
        config.objects = data.objects;
        config.wires = data.wires;
        return config;
    }
}
    