
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.5' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\DraggableItem.svelte generated by Svelte v3.42.5 */
    const file$3 = "src\\components\\DraggableItem.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "DraggebleItem-comp svelte-1k9cdrr");
    			attr_dev(div, "style", /*orderStyle*/ ctx[0]);
    			attr_dev(div, "draggable", "true");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "dragstart", /*onDrag*/ ctx[1], false, false, false),
    					listen_dev(div, "dragenter", /*onDragEnter*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[6],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*orderStyle*/ 1) {
    				attr_dev(div, "style", /*orderStyle*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let orderStyle;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DraggableItem', slots, ['default']);
    	let { temp_index = 0 } = $$props;
    	let { id = 0 } = $$props;
    	let { orderIndex = 0 } = $$props;
    	const dispatche = createEventDispatcher();

    	const onDrag = () => {
    		dispatche("element-draged", { id, orderIndex });
    	};

    	const onDragEnter = () => {
    		dispatche("sorte-list", { newOrder: orderIndex });
    	};

    	const writable_props = ['temp_index', 'id', 'orderIndex'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DraggableItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('temp_index' in $$props) $$invalidate(3, temp_index = $$props.temp_index);
    		if ('id' in $$props) $$invalidate(4, id = $$props.id);
    		if ('orderIndex' in $$props) $$invalidate(5, orderIndex = $$props.orderIndex);
    		if ('$$scope' in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		temp_index,
    		id,
    		orderIndex,
    		dispatche,
    		onDrag,
    		onDragEnter,
    		orderStyle
    	});

    	$$self.$inject_state = $$props => {
    		if ('temp_index' in $$props) $$invalidate(3, temp_index = $$props.temp_index);
    		if ('id' in $$props) $$invalidate(4, id = $$props.id);
    		if ('orderIndex' in $$props) $$invalidate(5, orderIndex = $$props.orderIndex);
    		if ('orderStyle' in $$props) $$invalidate(0, orderStyle = $$props.orderStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*orderIndex*/ 32) {
    			$$invalidate(0, orderStyle = `order:${orderIndex}`);
    		}
    	};

    	return [orderStyle, onDrag, onDragEnter, temp_index, id, orderIndex, $$scope, slots];
    }

    class DraggableItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { temp_index: 3, id: 4, orderIndex: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DraggableItem",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get temp_index() {
    		throw new Error("<DraggableItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set temp_index(value) {
    		throw new Error("<DraggableItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<DraggableItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<DraggableItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get orderIndex() {
    		throw new Error("<DraggableItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set orderIndex(value) {
    		throw new Error("<DraggableItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * @author: Marc Riegel <mail@marclab.de>
     * Date: 23.01.13
     * Time: 11:04
     *
     */
    var sChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var sNumbers = '0123456789';
    var sSticks = '-_';
    var sSpecialChars = ',.;:#*?=)(/&%$§"!¡“¢[]|{}≠@';

    /**
     *
     * @type {Object}
     */
    var Keygen = {};

    Keygen.defaults = {
      chars: true,
      numbers: true,
      specials: false,
      sticks: false,
      forceUppercase: false,
      forceLowercase: false,
      length: 32
    };

    /**
     *
     * @param options
     * @return {String}
     */
    Keygen.generate = function (options) {
      var key, length, useChars, useNumbers, useSticks,
        useSpecials, forceUppercase, forceLowercase, exclude,
        chars, i, randomPoz;

      if (typeof options !== 'object') {
        options = {};
      }

      for (key in Keygen.defaults) {
        if (Keygen.defaults.hasOwnProperty(key)) {
          if (!options.hasOwnProperty(key)) {
            options[key] = Keygen.defaults[key];
          }
        }
      }

      length = isNaN(options.length) ? 32 : options.length;
      useChars = options.chars;
      useNumbers = options.numbers;
      useSticks = options.sticks;
      useSpecials = options.specials;
      forceUppercase = options.forceUppercase;
      forceLowercase = options.forceLowercase;
      exclude = (options.exclude instanceof Array) ? options.exclude : [];

      chars = '';
      if (useChars) {
        chars += sChars;
      }

      if (useNumbers) {
        chars += sNumbers;
      }

      if (useSticks) {
        chars += sSticks;
      }

      if (useSpecials) {
        chars += sSpecialChars;
      }

      if (chars === '') {
        throw 'You must select at least one char type.';
      }

      for (i = 0; i < exclude.length; i++) {
        chars = chars.replace(exclude[i], '');
      }

      key = '';
      for (i = 0; i < length; i++) {
        randomPoz = Math.floor(Math.random() * chars.length);
        key += chars.substring(randomPoz, randomPoz + 1);
      }

      if (forceUppercase) {
        key = key.toUpperCase();
      }

      if (forceLowercase) {
        key = key.toLowerCase();
      }

      return key;
    };

    /**
     *
     * @param options
     * @return {String}
     */
    Keygen.password = function (options) {
      options = options || {};

      return Keygen.generate({
        chars: true,
        sticks: false,
        numbers: true,
        specials: false,
        length: isNaN(options.length) ? 8 : options.length,
        exclude: [
          'O', '0', 'I', '1'
        ]
      });
    };

    /**
     *
     * @param options
     * @return {String}
     */
    Keygen.session_id = function (options) {
      options = options || {};

      return Keygen.generate({
        chars: true,
        sticks: true,
        numbers: true,
        specials: false,
        length: isNaN(options.length) ? 32 : options.length
      });
    };

    /**
     *
     * @param options
     * @return {String}
     */
    Keygen.transaction_id = function (options) {
      options = options || {};

      return Keygen.generate({
        chars: true,
        sticks: true,
        numbers: true,
        specials: true,
        length: isNaN(options.length) ? 6 : options.length
      });
    };

    /**
     *
     * @param options
     * @return {String}
     */
    Keygen.number = function (options) {
      options = options || {};

      return Keygen.generate({
        chars: false,
        sticks: false,
        numbers: true,
        specials: false,
        length: isNaN(options.length) ? 8 : options.length
      });
    };

    /**
     * Alias for generate()
     */
    Keygen._ = Keygen.generate;


    var keygen = Keygen;

    /**
     * @author: Marc Riegel <mail@marclab.de>
     * Date: 23.01.13
     * Time: 11:04
     *
     */

    var keygenerator = keygen;

    /* src\components\DraggableList.svelte generated by Svelte v3.42.5 */

    const { console: console_1$1 } = globals;
    const file$2 = "src\\components\\DraggableList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (3:4) <DraggableItem  {...{id:ids[index] ,temp_index:index ,orderIndex:orderList[index]}}       on:element-draged={registerDragedInfo} on:sorte-list={sorteList}>
    function create_default_slot(ctx) {
    	let switch_instance;
    	let t;
    	let current;
    	const switch_instance_spread_levels = [/*prop*/ ctx[9]];
    	var switch_value = /*component*/ ctx[1];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 1)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*prop*/ ctx[9])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, t.parentNode, t);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (switch_instance) destroy_component(switch_instance, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(3:4) <DraggableItem  {...{id:ids[index] ,temp_index:index ,orderIndex:orderList[index]}}       on:element-draged={registerDragedInfo} on:sorte-list={sorteList}>",
    		ctx
    	});

    	return block;
    }

    // (2:0) {#each props as prop , index}
    function create_each_block(ctx) {
    	let draggableitem;
    	let current;

    	const draggableitem_spread_levels = [
    		{
    			id: /*ids*/ ctx[3][/*index*/ ctx[11]],
    			temp_index: /*index*/ ctx[11],
    			orderIndex: /*orderList*/ ctx[2][/*index*/ ctx[11]]
    		}
    	];

    	let draggableitem_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < draggableitem_spread_levels.length; i += 1) {
    		draggableitem_props = assign(draggableitem_props, draggableitem_spread_levels[i]);
    	}

    	draggableitem = new DraggableItem({
    			props: draggableitem_props,
    			$$inline: true
    		});

    	draggableitem.$on("element-draged", /*registerDragedInfo*/ ctx[5]);
    	draggableitem.$on("sorte-list", /*sorteList*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(draggableitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(draggableitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const draggableitem_changes = (dirty & /*ids, orderList*/ 12)
    			? get_spread_update(draggableitem_spread_levels, [
    					{
    						id: /*ids*/ ctx[3][/*index*/ ctx[11]],
    						temp_index: /*index*/ ctx[11],
    						orderIndex: /*orderList*/ ctx[2][/*index*/ ctx[11]]
    					}
    				])
    			: {};

    			if (dirty & /*$$scope, component, props*/ 4099) {
    				draggableitem_changes.$$scope = { dirty, ctx };
    			}

    			draggableitem.$set(draggableitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(draggableitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(draggableitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(draggableitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(2:0) {#each props as prop , index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let each_value = /*props*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "DraggbleList-comp svelte-afrawz");
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ids, orderList, registerDragedInfo, sorteList, component, props*/ 63) {
    				each_value = /*props*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DraggableList', slots, []);
    	let { len = 10 } = $$props;
    	let { props = [{}] } = $$props;
    	let { component } = $$props;
    	let ids = [];

    	for (let i = 0; i < len; i++) {
    		ids.push(keygenerator._());
    	}

    	let orderList = [...Array(len).keys()];
    	let draged_InitOrder = null;
    	let draged_ID = 0;

    	const sorteList = ({ detail }) => {
    		console.log(detail);

    		if (draged_InitOrder < detail.newOrder) {
    			for (let i = draged_InitOrder + 1; i <= detail.newOrder; i++) {
    				$$invalidate(2, orderList[orderList.indexOf(i)] = orderList[orderList.indexOf(i)] - 1, orderList);
    			}
    		} else {
    			for (let i = detail.newOrder; i < draged_InitOrder; i++) {
    				$$invalidate(2, orderList[orderList.indexOf(i)] = orderList[orderList.indexOf(i)] + 1, orderList);
    			}
    		}

    		$$invalidate(2, orderList[ids.indexOf(draged_ID)] = detail.newOrder, orderList);
    		draged_InitOrder = detail.newOrder;
    	};

    	const registerDragedInfo = ({ detail }) => {
    		draged_InitOrder = detail.orderIndex;
    		draged_ID = detail.id;
    	};

    	const writable_props = ['len', 'props', 'component'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<DraggableList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('len' in $$props) $$invalidate(6, len = $$props.len);
    		if ('props' in $$props) $$invalidate(0, props = $$props.props);
    		if ('component' in $$props) $$invalidate(1, component = $$props.component);
    	};

    	$$self.$capture_state = () => ({
    		DraggableItem,
    		idGen: keygenerator._,
    		len,
    		props,
    		component,
    		ids,
    		orderList,
    		draged_InitOrder,
    		draged_ID,
    		sorteList,
    		registerDragedInfo
    	});

    	$$self.$inject_state = $$props => {
    		if ('len' in $$props) $$invalidate(6, len = $$props.len);
    		if ('props' in $$props) $$invalidate(0, props = $$props.props);
    		if ('component' in $$props) $$invalidate(1, component = $$props.component);
    		if ('ids' in $$props) $$invalidate(3, ids = $$props.ids);
    		if ('orderList' in $$props) $$invalidate(2, orderList = $$props.orderList);
    		if ('draged_InitOrder' in $$props) draged_InitOrder = $$props.draged_InitOrder;
    		if ('draged_ID' in $$props) draged_ID = $$props.draged_ID;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [props, component, orderList, ids, sorteList, registerDragedInfo, len];
    }

    class DraggableList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { len: 6, props: 0, component: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DraggableList",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*component*/ ctx[1] === undefined && !('component' in props)) {
    			console_1$1.warn("<DraggableList> was created without expected prop 'component'");
    		}
    	}

    	get len() {
    		throw new Error("<DraggableList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set len(value) {
    		throw new Error("<DraggableList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get props() {
    		throw new Error("<DraggableList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set props(value) {
    		throw new Error("<DraggableList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<DraggableList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<DraggableList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Button.svelte generated by Svelte v3.42.5 */
    const file$1 = "src\\components\\Button.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*index*/ ctx[0]);
    			add_location(button, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*dispatche*/ ctx[1]("event", /*index*/ ctx[0]))) /*dispatche*/ ctx[1]("event", /*index*/ ctx[0]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*index*/ 1) set_data_dev(t, /*index*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, []);
    	const dispatche = createEventDispatcher();
    	let { index = 0 } = $$props;
    	const writable_props = ['index'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({ createEventDispatcher, dispatche, index });

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [index, dispatche];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { index: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get index() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.42.5 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let draggablelist;
    	let current;

    	draggablelist = new DraggableList({
    			props: {
    				len: 5,
    				component: Button,
    				props: /*indexs*/ ctx[0],
    				event: { test: /*test*/ ctx[1] }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(draggablelist.$$.fragment);
    			attr_dev(div, "id", "app");
    			attr_dev(div, "class", "svelte-1k1hgk0");
    			add_location(div, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(draggablelist, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(draggablelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(draggablelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(draggablelist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let indexs = [{ index: 0 }, { index: 1 }, { index: 2 }, { index: 3 }, { index: 4 }];

    	const test = ({ detail }) => {
    		console.log("test");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ DraggableList, Button, indexs, test });

    	$$self.$inject_state = $$props => {
    		if ('indexs' in $$props) $$invalidate(0, indexs = $$props.indexs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [indexs, test];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
