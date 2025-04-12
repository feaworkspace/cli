export function get(object: any, property: string) {
    const parts = property.split('.');
    for (const part of parts) {
        if (!object) {
            return undefined;
        }
        if(Array.isArray(object) && !isNaN(Number(part))) {
            object = object[Number(part)];
        } else if(Array.isArray(object)) {
            object = object.find((item: any) => item.name === part);
        } else {
            object = object[part];
        }
    }
    return object;
}

/*
names:
  test: toto

names.test = tata


*/

export function set(object: any, fullProperty: string, value: any) {
    const properties = fullProperty.split('.');
    for(let i = 0; i < properties.length; i++) {
        const property = properties[i];
        const isLast = i === properties.length - 1;
        if (Array.isArray(object) && !isNaN(Number(property))) {
            if (!object[Number(property)]) {
                object[Number(property)] = {};
            }
            if(isLast) {
                object[Number(property)] = value;
            }
            object = object[Number(property)];
        } else if(Array.isArray(object)) {
            let child = object.find((item: any) => item.name === property);
            if (!child) {
                child = { name: value };
                object.push(child);
            }
            if(isLast) {
                Object.assign(child, value);
            }
            object = child;
        } else {
            if (!object[property]) {
                object[property] = {};
            }
            if(isLast) {
                object[property] = value;
            }
            object = object[property];
        }
    }
}

export function overrideObject(object: any, override: any) {
    if(!override) {
        return object;
    }
    for (const key in override) {
        if (typeof override[key] === 'string') {
            set(object, key, override[key]);
        } else if (typeof override[key] === 'object') {
            if(!object[key]) {
                object[key] = override[key];
            } else {
                object[key] = overrideObject(object[key], override[key]);
            }
        }
    }

    return object;
}

export function map(object: any, callback: (key: string, value: any) => any) {
    const result: any = {};
    for (const key in object) {
        result[key] = callback(key, object[key]);
    }
    return result;
}

export function toArray(object: Record<string, any>, keyName: string = 'key') {
    if(!object || keyName !in object) {
        return [];
    }
    return Object.entries(object).map(([key, value]) => ({ [keyName]: key, ...value }));
}

export function merge(target: any, source: any) {
    target = JSON.parse(JSON.stringify(target));
    for (const key in source) {
        if(typeof source[key] === "object" && Array.isArray(source[key])) {
            if (!target[key]) {
                Object.assign(target, { [key]: [] });
            }
            source[key].forEach((item: any) => {
                if (!target[key].includes(item)) {
                    target[key].push(item);
                }
            });
        } else if (typeof source[key] === "object") {
            if (!target[key]) {
                Object.assign(target, { [key]: {} });
            }
            Object.assign(target[key], merge(target[key], source[key]));
        } else {
            Object.assign(target, { [key]: source[key] });
        }
    }
    return target;
}