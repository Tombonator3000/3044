// Keep legacy frame timers at 60 ticks/second, independently of display refresh.
export class FixedStepClock {
    constructor() {
        this.step = 1000 / 60;
        this.accumulator = 0;
    }

    reset() {
        this.accumulator = 0;
    }

    advance(elapsed) {
        if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
        // A tab switch or long stall must not unleash a burst of stale attacks.
        if (elapsed > 250) {
            this.reset();
            return 0;
        }
        this.accumulator += Math.min(elapsed, this.step * 5);
        const steps = Math.min(5, Math.floor((this.accumulator + 1e-7) / this.step));
        this.accumulator = Math.max(0, this.accumulator - steps * this.step);
        return steps;
    }
}
