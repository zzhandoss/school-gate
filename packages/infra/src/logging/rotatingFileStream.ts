import fs from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";

type RotatingFileStreamOptions = {
    filePath: string;
    maxBytes: number;
    retentionDays: number;
};

class RotatingFileStream extends Writable {
    private readonly filePath: string;
    private readonly dirPath: string;
    private readonly baseName: string;
    private readonly maxBytes: number;
    private readonly retentionMs: number;
    private fd: number;
    private size: number;

    constructor(input: RotatingFileStreamOptions) {
        super();
        if (input.maxBytes <= 0) {
            throw new Error("maxBytes must be positive");
        }
        this.filePath = input.filePath;
        this.dirPath = path.dirname(input.filePath);
        this.baseName = path.basename(input.filePath);
        this.maxBytes = input.maxBytes;
        this.retentionMs = input.retentionDays > 0 ? input.retentionDays * 24 * 60 * 60 * 1000 : 0;
        fs.mkdirSync(this.dirPath, { recursive: true });
        this.fd = fs.openSync(this.filePath, "a");
        this.size = this.getFileSize();
        this.cleanupOldFiles();
    }

    override _write(chunk: Buffer | string, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        try {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
            if (this.size + buffer.length > this.maxBytes) {
                this.rotate();
            }
            fs.writeSync(this.fd, buffer);
            this.size += buffer.length;
            callback();
        } catch (error) {
            callback(error as Error);
        }
    }

    override _final(callback: (error?: Error | null) => void) {
        try {
            fs.closeSync(this.fd);
            callback();
        } catch (error) {
            callback(error as Error);
        }
    }

    private getFileSize(): number {
        try {
            return fs.statSync(this.filePath).size;
        } catch {
            return 0;
        }
    }

    private rotate() {
        fs.closeSync(this.fd);
        const rotatedPath = `${this.filePath}.${formatTimestamp(new Date())}`;
        if (fs.existsSync(this.filePath)) {
            fs.renameSync(this.filePath, rotatedPath);
        }
        this.fd = fs.openSync(this.filePath, "a");
        this.size = 0;
        this.cleanupOldFiles();
    }

    private cleanupOldFiles() {
        if (this.retentionMs <= 0) return;
        const now = Date.now();
        const files = fs.readdirSync(this.dirPath);
        for (const file of files) {
            if (!file.startsWith(`${this.baseName}.`)) continue;
            const fullPath = path.join(this.dirPath, file);
            try {
                const stat = fs.statSync(fullPath);
                if (now - stat.mtimeMs > this.retentionMs) {
                    fs.unlinkSync(fullPath);
                }
            } catch {
                continue;
            }
        }
    }
}

function formatTimestamp(date: Date): string {
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

export function createRotatingFileStream(input: RotatingFileStreamOptions): Writable {
    return new RotatingFileStream(input);
}
