sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/Device", "comigo/com/br/PainelDeSenhas/model/models"], function (e, i, t) {
	"use strict";
	return e.extend("comigo.com.br.PainelDeSenhas.Component", {
		metadata: {
			manifest: "json",
			config: {
				fullWidth: true
			}
		},
		init: function () {
			e.prototype.init.apply(this, arguments);
			debugger;
			/*if (this.getComponentData().startupParameters['id_area'] == undefined){
				this.getComponentData().startupParameters = { 'id_area' :  ["0000000001"] };
			}*/
			this.setModel(new sap.ui.model.json.JSONModel({ 'id_area' : this.getComponentData().startupParameters.id_area[0]}), "area");
			this.getRouter().initialize();
			this.setModel(t.createDeviceModel(), "device");
		}
	})
});