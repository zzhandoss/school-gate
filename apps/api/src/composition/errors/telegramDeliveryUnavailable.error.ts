export class TelegramDeliveryUnavailableError extends Error {
    constructor() {
        super("Telegram delivery is unavailable");
        this.name = "TelegramDeliveryUnavailableError";
    }
}
