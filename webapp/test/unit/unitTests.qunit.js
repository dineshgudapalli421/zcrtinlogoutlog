/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comlhsapui5/zcrtinlogoutlog/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
