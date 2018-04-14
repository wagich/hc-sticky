// Type definitions for hc-sticky 2.x
// Definitions by: Michael Wagner <https://github.com/wagich>

export as namespace hcSticky;

export = hcSticky;

declare class hcSticky {
    /**
     * Creates a new sticky element
     * @param  {string|Element} element The element to be positioned
     * @param  {hcStickyOptions} options Optional settings
     */
    constructor(element: string | Element, options?: hcSticky.hcStickyOptions);
    
    /**
     * Returns current settings
     * @returns hcSticky
     */
    options(): hcSticky.hcStickyOptions;
    
    /**
     * Returns a specific setting
     * @param  {string} options?
     * @returns any
     */
    options(options?: string): any;
    
    /**
     * Updates the settings with the new ones.
     * @param  {hcStickyOptions} options The new settings
     * @returns hcSticky
     */
    update(options: hcSticky.hcStickyOptions): hcSticky.hcStickyOptions;
    
    /**
     * Recalculates sticky size and position. Useful after altering DOM elements inside sticky.
     */
    reinit(): void;

    /**
     * Detaches the HC-Sticky from element, preventing it from running.
     */
    detach(): void;
    
    /**
     * Attaches the HC-Sticky back to the element.
     */
    attach(): void;

    /**
     * Completely destroys HC-Sticky and reverts element to original state.
     */
    destroy(): void;
}

declare namespace hcSticky {
    export interface hcStickyOptions {
        /**
         * The distance from the top of the Window at which to trigger HC-Sticky.
         * @default 0
         */
        top?: number;

        /**
         * The distance from the bottom of the Window at which to attach HC-Sticky.
         * @default 0
         */
        bottom?: number;

        /**
         * The distance from the top inside of the sticky element at which to trigger HC-Sticky.
         * @default 0
         */
        innerTop?: number;

        /**
         * The distance from the bottom of the referring element at which to stop HC-Sticky.
         * @default 0
         */
        bottomEnd?: number;

        /**
         * Element inside of the sticky element at which to attach HC-Sticky. 
         * This has higher priority than innerTop option.
         * @default null
         */
        innerSticker?: string | Element,

        /**
         * HTML class that will be applied to sticky element while it is attached.
         * @default "sticky"
         */
        stickyClass?: string,

        /**
         * Element that represents the reference for height instead of height of the container (parent element).
         * @default null
         */
        stickTo?: string | Element,

        /**
         * When set to `false`, sticky content will not move with the page if it is bigger than Window.
         * @default true
         */
        followScroll?: boolean,

        /**
         * Object containing responsive breakpoints, on which you can tell HC Sticky what to do.
         * @default null
         */
        queries?: any,

        /**
         * Callback function fired when the element becomes attached.
         */
        onStart?: (this: Element, options: hcStickyOptions) => any,

        /**
         * Callback function fired when the element stops floating.
         */
        onStop?: (this: Element, options: hcStickyOptions) => any,

        /**
         * Callback function fired before sticky has been resized (happens after Window resize and before sticky reinit).
         */
        onBeforeResize?: (this: Element, options: hcStickyOptions) => any,

        /**
         * Callback function fired after sticky has been resized (happens after Window resize and sticky reinit).
         */
        onResize?: (this: Element, options: hcStickyOptions) => any,

        /**
         * Limit the rate (in milliseconds) at which the HC Sticky can fire on window resize.
         * @default 100
         */
        resizeDebounce?: number;

        /**
         * When set to `false`, no spacer element will be added when the element is stickied. The spacer element prevents layout changes because sticky elements are removed from document flow.
         * @default true
         */
        spacer?: boolean;
    }
}
