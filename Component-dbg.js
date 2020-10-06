sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"comigo/com/br/PainelDeSenhas/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("comigo.com.br.PainelDeSenhas.Component", {

		metadata: {
			manifest: "json",
			config: { fullWidth: true }
		},
		
		init: function () {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});