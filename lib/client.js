window.__ModuleLoader__.load({
	id: "dsh-cool-daily",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		// src/client/index.ts
		/**
		* Client entry for dsh-cool-daily.
		*
		* This half runs in the DSH web client. It is an empty shell with no UI; slot
		* contributions are added here when the plugin needs a view.
		*/
		const name = "dsh-cool-daily/client";
		function apply(_ctx) {}
		exports.apply = apply;
		exports.name = name;
		return module.exports;
	}
});
