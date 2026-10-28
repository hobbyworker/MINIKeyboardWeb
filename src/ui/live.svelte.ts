// The view models say when they changed; the interface reads what it draws again. `Live` turns the one into the
// other: each change counts up a number the components' reads depend on, so a read made through `read` runs again
// after every change.

import { untrack } from "svelte";

/** A view model that calls back after each change. */
export interface Observable {
    subscribe(listener: () => void): () => void;
}

export class Live<Model extends Observable> {
    readonly model: Model;
    #revision = $state(0);

    constructor(model: Model) {
        this.model = model;
    }

    /** Follows the model until the returned function is called — from an `$effect`, which calls it on teardown. */
    follow(): () => void {
        // Counting up reads the count: untracked, so the effect that follows — or one whose work changes the model —
        // doesn't come to depend on it and run again.
        const changed = () =>
            untrack(() => {
                this.#revision += 1;
            });
        const stop = this.model.subscribe(changed);
        // A change between the first reads and now would have gone unseen.
        changed();
        return stop;
    }

    /** What `read` returns, read again after each change of the model. */
    read<T>(read: (model: Model) => T): T {
        void this.#revision;
        return read(this.model);
    }
}
