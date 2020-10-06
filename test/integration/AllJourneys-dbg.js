/* global QUnit*/

sap.ui.define([
	"sap/ui/test/Opa5",
	"comigo/com/br/PainelDeSenhas/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"comigo/com/br/PainelDeSenhas/test/integration/pages/Painel",
	"comigo/com/br/PainelDeSenhas/test/integration/navigationJourney"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "comigo.com.br.PainelDeSenhas.view.",
		autoWait: true
	});
});