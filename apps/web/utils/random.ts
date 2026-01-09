export function randomPastelColor(): string {
    const r = Math.floor(Math.random() * 128 + 127);
    const g = Math.floor(Math.random() * 128 + 127);
    const b = Math.floor(Math.random() * 128 + 127);
    return `rgb(${r}, ${g}, ${b})`;
}

export function randomColor(existing: string[] = []): string {
    let color: string;
    do {
        color = randomPastelColor();
    } while (existing.includes(color));
    return color;
}


export function randomUserName(existing: string[] = []): string {
    let name: string;
    do {
        name = crypto.randomUUID().slice(0, 5);
    } while (existing.includes(name));
    return name;
}
