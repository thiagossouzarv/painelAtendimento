jQuery.sap.registerPreloadedModules({
	"version": "2.0",
	"modules": {
		"comigo/com/br/PainelDeSenhas/Component.js": function () {
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
						if (this.getComponentData().startupParameters['id_area'] == undefined){
							this.getComponentData().startupParameters = { 'id_area' :  ["0000000001"] };
						}
						this.setModel(new sap.ui.model.json.JSONModel({ 'id_area' : this.getComponentData().startupParameters.id_area[0]}), "area");
						e.prototype.init.apply(this, arguments);
						this.getRouter().initialize();
						this.setModel(t.createDeviceModel(), "device")
					}
				})
			});
		},
		"comigo/com/br/PainelDeSenhas/controller/Painel.controller.js": function () {
			sap.ui.define(["sap/ui/core/mvc/Controller"], function (a) {
				"use strict";
				var n = function (a) {
					return a.toString().length == 1 ? "0" + a : a
				};
				var e = {};
				return a.extend("comigo.com.br.PainelDeSenhas.controller.Painel", {
					onInit: function () {
						$("#listaChamadas .listagem .item").css("height", "calc((100% - 2em)/ 12)");
						e = {
							dateUtils: {
								isPast: function (a) {
									return a < (new Date).setHours(0, 0, 0, 0)
								},
								dateToString: function (a) {
									return n(a.getDate()) + "/" + n(a.getMonth() * 1 + 1) + "/" + a.getFullYear()
								}
							},
							tipoCard: {
								chamada: 1,
								listaChamadas: 2
							},
							tiposDados: {
								senha: 1,
								mensagem: 2
							},
							validacao: {
								isNullOrEmpty: function (a) {
									return a == null || a.length == 0
								}
							},
							diasSemana: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sabado"],
							meses: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro",
								"Dezembro"
							],
							updateSenhasTiming: 5e3,
							server: {
								senhas: [],
								primeiraRodagem: true
							},
							chamada: {
								ultimaSenhaChamada: null,
								audioSenha: document.getElementById("audioSenha"),
								senhas: [],
								fila: [],
								numSenhasNovas: 0,
								replaceSenhas: function (a) {
									this.senhas.length = 0;
									this.senhas.push.apply(this.senhas, a)
								},
								lblSenha: $("#lblSenha"),
								lblGuiche: $("#lblGuiche"),
								lblPlaca: $("#lblPlaca"),
								lblVeiculo: $("#lblVeiculo"),
								lblData: $("#lblData"),
								lblOculto: $("#lblGuicheOculto"),
								campainha: document.getElementById("campainha")
							},
							listaChamada: {
								lastUpdate: (new Date).getTime(),
								bloqueada: false,
								timing: 1e4,
								allItens: $("#listaChamadas").find(".item"),
								itens: Array.from($("#listaChamadas").find(".item")).map(function (a) {
									return $(a)
								}),
								senhas: [],
								numSenhasNovas: 0,
								numSenhasRemovidas: 0,
								currentPage: 0
							},
							relogio: {
								timing: 5e3,
								dia: $("#infoDiaHora .lblDia"),
								hora: $("#infoDiaHora .lblHora")
							},
							boxMensagem: {
								timing: 5e3,
								mensagens: [],
								numMensagensNovas: 0,
								numMensagensRemovidas: 0,
								currentMsg: 0,
								mensagem: $("#boxMessage"),
								loop: null
							},
							painelPrevisao: {
								timing: 1 * 60 * 60 * 1e3,
								allIcons: $("#iconeClima > span"),
								icones: {
									sol: $("#iconSol"),
									nuvem: $("#iconNuvem"),
									chuva: $("#iconChuva")
								},
								max: $("#tempMax"),
								min: $("#tempMin")
							}
						};
						var a = this;
						$("#infoClima").hide();
						$("#btnAbrirPainel").on("click", function () {
							return a.abrirPainel()
						})
					},
					abrirPainel: function () {
						$("#menu").fadeOut(1400);
						e.listaChamada.allItens.hide();
						this.initPainel()
					},
					initPainel: function () {
						var a = $("#infoDiaHora");
						var n = $("#infoClima");
						var e = this;
						var t = this.animarQuadroInfo.bind(this);
						this.updateSenhas();
						this.loopChamada();
						this.initRelogio();
						this.updateMensagens();
						this.loopMensagens();
						this.initPainelPrevisao();
						setInterval(function () {
							var e = a.is(":visible") ? n : a;
							var i = a.is(":visible") ? a : n;
							t(i);
							i.fadeOut(300, function () {
								e.fadeIn(300)
							})
						}, 2e4)
					},
					animarQuadroInfo: function (a) {
						var n = this;
						return new Promise(function (n, e) {
							a.parent().animate({
								opacity: 100
							}, {
								duration: 2e3,
								step: function (a, n) {
									$(this).addClass("spin")
								},
								complete: function () {
									$(this).removeClass("spin")
								},
								progress: function (a, n, e) {}
							});
							n()
						})
					},
					updateSenhas: function (a) {
						var n = this;
						var t = e;
						var i = t.chamada;
						var r = t.listaChamada;
						var s = t.boxMensagem;
						var o = this.renovarItens.bind(this);
						var u = t.dateUtils;
						var l = function () {
							var a = "/sap/opu/odata/sap/ZAPP_SENHAS_SRV/senhas";
							var e = [];
							jQuery.ajax({
								url: a,
								timeout: 1e4,
								dataType: "json",
								success: function (a, n, i) {
									var r = Array.from(a.d.results);
									var s = t.server.primeiraRodagem;
									var o = r.length;
									for (var l = 0; l < o; l++) {
										var h = r[l];
										var m = h.DataCriacao;
										var a = new Date(m);
										var c = "data:audio/mp3;base64," + h.Audio;
										var d = (h.QuantidadeChamadas || 1) * 1;
										e.push({
											valor: h.Senha,
											guiche: h.Guiche,
											placa: h.Placa,
											veiculo: h.TipoCaminhao,
											data: a,
											dataString: u.dateToString(a),
											isAguardando: h.Status == "H",
											contador: d,
											totalShow: s ? d - 1 : 0,
											isChamar: function () {
												return this.contador > this.totalShow
											},
											audio: h.Audio.length > 0 ? c : null
										})
									}
									t.server.senhas = e;
									t.server.primeiraRodagem = false
								},
								error: function (a) {
									console.log("Erro na requisição das senhas")
								}
							}).always(function () {
								setTimeout(l.bind(n), t.updateSenhasTiming)
							})
						};
						l()
					},
					updateMensagens: function () {
						var a = this;
						var n = e;
						var t = n.boxMensagem;
						var i = this.updateBoxMensagem.bind(this);
						var r = this.renovarItens.bind(this);
						var s = function (e, o) {
							var u = "/sap/opu/odata/sap/ZAPP_SENHAS_SRV/Mensagem";
							jQuery.ajax({
								url: u,
								timeout: 1e4,
								dataType: "json",
								success: function (a, e, i) {
									var s = a.d.results;
									var o = s.length > 0 ? Array.from(s).map(function (a) {
										return a.Texto
									}) : [];
									var u = r(t.mensagens, o, n.tiposDados.mensagem);
									t.mensagens = u.itens;
									t.numMensagensNovas = u.numItensNovos;
									t.numMensagensRemovidas = u.numItensRemovidos
								},
								error: function (a) {
									console.log("Erro na requisição das mensagens")
								}
							}).always(function () {
								if (t.numMensagensNovas > 0 || t.numMensagensRemovidas > 0) {
									a.stopLoopMensagens();
									i();
									setTimeout(a.loopMensagens.bind(a), 1e3)
								}
								setTimeout(s.bind(a), t.timing)
							})
						};
						s()
					},
					loopMensagens: function () {
						var a = this;
						var n = this.updateBoxMensagem.bind(this);
						e.boxMensagem.loop = setInterval(n, 6e4)
					},
					stopLoopMensagens: function () {
						clearInterval(e.boxMensagem.loop)
					},
					renovarItens: function (a, n, t, i) {
						i = i != null ? i : false;
						a = Array.from(a);
						n = Array.from(n);
						var r = e.tiposDados;
						t = t || r.senha;
						var s = this;
						var o = e.chamada;
						var u = 0;
						var l = 0;
						var h = [];
						var m = [];
						var c = function (a) {
							return a.sort(function (a, n) {
								if (a.isAguardando && n.isAguardando) return a.guiche * 1 > n.guiche * 1 ? 1 : -1;
								else if (a.isAguardando || n.isAguardando) return n.isAguardando ? 1 : -1;
								else return a.guiche * 1 > n.guiche * 1 ? 1 : -1
							})
						};
						if (i) {
							var h = Array.from(o.fila);
							var d = [];
							h.forEach(function (a) {
								var e = s.hasSenha(n, a);
								if (e) d.push(a)
							});
							m = d
						}
						while (a.length > 0) {
							var v = a.shift();
							var f = t == r.senha ? n.findIndex(function (a) {
								return a.valor == v.valor && a.guiche == v.guiche && a.dataString == v.dataString && a.isAguardando == v.isAguardando &&
									a.veiculo == v.veiculo && a.placa == v.placa
							}) : n.indexOf(v);
							var g = f != -1;
							if (g) {
								var p = n.splice(f, 1)[0];
								if (t == r.senha) {
									p.totalShow = v.totalShow * 1;
									if (i && p.isAguardando || !i && p.totalShow > 0) {
										h.push(p);
										if (i && p.isChamar() && !s.hasSenha(Array.from(o.fila), p)) m.push(p)
									} else u += 1
								} else h.push(p)
							} else u += 1
						}
						l = n.length;
						if (l > 0) {
							if (t == r.senha && !i) {
								l = 0;
								h = c(h);
								n = []
							}
							h = i ? h.concat(n) : n.concat(h);
							if (i) m = m.concat(n)
						}
						return {
							numItensNovos: l,
							numItensRemovidos: u,
							itens: h,
							fila: m
						}
					},
					hasSenha: function (a, n) {
						return a.findIndex(function (a) {
							return a.valor == n.valor && a.guiche == n.guiche && a.placa == n.placa && a.dataString == n.dataString
						}) != -1
					},
					getSenhaIfExist: function (a, n) {
						return a.find(function (a) {
							return a.valor == n.valor && a.guiche == n.guiche && a.placa == n.placa && a.dataString == n.dataString
						})
					},
					updateSenhasChamada: function () {
						var a = this;
						return new Promise(function (n) {
							var t = e;
							var i = t.server.senhas;
							var r = i.filter(function (a) {
								return a.isAguardando
							});
							var s = a.renovarItens.bind(a);
							var o = t.chamada;
							var u = s(Array.from(o.senhas), r, null, true);
							o.senhas = u.itens;
							o.fila = u.fila;
							n()
						})
					},
					loopChamada: function () {
						var a = this;
						var n = e;
						var t = n.chamada;
						var i = this.chamarItem.bind(this);
						var r = this.clearChamada.bind(this);
						var s = this.updateSenhasChamada.bind(this);
						var o = this.forceRenderLista.bind(this);
						var u = this.updateItensLista.bind(this);
						var l = function () {
							var e = function () {
								return setTimeout(l.bind(a), 1e3)
							};
							s().then(function () {
								try {
									u().then(function (s) {
										var u;
										var l = (new Date).getTime() - n.listaChamada.lastUpdate;
										if (n.listaChamada.numSenhasRemovidas > 0 || n.listaChamada.numSenhasNovas > 0) u = o();
										else {
											if (l > n.listaChamada.timing && t.fila.length == 0) {
												n.listaChamada.lastUpdate = (new Date).getTime();
												a.renderListaChamadas()
											}
											u = new Promise(function (a) {
												return a()
											})
										}
										u.then(function (s) {
											if (t.fila.length == 0) {
												var u = Array.from(n.server.senhas);
												var l = u.length > 0 && t.ultimaSenhaChamada != null ? a.getSenhaIfExist(u, t.ultimaSenhaChamada) : null;
												var h = !l || !l.isAguardando;
												if (t.senhas.length == 0 || h) r();
												e();
												return
											}
											var m = t.fila.shift();
											var c = a.getSenhaIfExist(t.senhas, m);
											i(m).then(function (t) {
												c.totalShow += 1;
												if (!a.hasSenha(Array.from(n.listaChamada.senhas), m)) {
													n.listaChamada.senhas.unshift(m);
													n.listaChamada.numSenhasNovas = 1;
													o().finally(function (a) {
														return e()
													})
												} else e()
											})
										})
									})
								} catch (a) {
									console.log("Erro loop chamada");
									e()
								}
							})
						};
						l()
					},
					updateItensLista: function () {
						var a = e;
						var n = a.listaChamada;
						var t = a.server;
						var i = this;
						var r = t.senhas.filter(function (a) {
							return !a.isAguardando
						});
						var s = function (a) {
							return a.sort(function (a, n) {
								if (a.isAguardando && n.isAguardando) return a.guiche * 1 > n.guiche * 1 ? 1 : -1;
								else if (a.isAguardando || n.isAguardando) return n.isAguardando ? 1 : -1;
								else return a.guiche * 1 > n.guiche * 1 ? 1 : -1
							})
						};
						return new Promise(function (a) {
							var e = [];
							var o = 0;
							var u = 0;
							n.senhas.forEach(function (a) {
								var n = i.getSenhaIfExist(Array.from(t.senhas), a);
								if (n) {
									if (n.isAguardando != a.isAguardando) u++;
									e.push(n)
								} else o++
							});
							r.forEach(function (a) {
								if (!i.hasSenha(Array.from(n.senhas), a)) {
									e.push(a);
									u++
								}
							});
							n.senhas = s(e);
							n.numSenhasRemovidas = o;
							n.numSenhasNovas = u;
							setTimeout(function () {
								return a()
							}, 50)
						})
					},
					animarChamada: function () {
						var a = this.sleep.bind(this);
						var n = 200;
						var e = this.zoomItem.bind(this);
						return new Promise(function (t) {
							e($("#cardSenha")).then(a(n)).then(function (a) {
								return e($("#cardGuiche"))
							}).then(function (a) {
								return t()
							})
						})
					},
					zoomItem: function (a) {
						return new Promise(function (n, e) {
							a.animate({
								opacity: 100
							}, {
								duration: 1300,
								step: function (a, n) {
									$(this).addClass("animate")
								},
								complete: function () {
									$(this).removeClass("animate")
								},
								progress: function (a, n, e) {}
							});
							n()
						})
					},
					chamarItem: function (a) {
						var n = this;
						var t = e;
						var i = t.chamada;
						var r = this.tocarAudio.bind(this);
						var s = this.animarChamada.bind(this);
						return new Promise(function (e, o) {
							var u = t.validacao;
							var l = n.animarChamada.bind(n);
							var h = t.dateUtils;
							var m = function () {
								i.campainha.play();
								removeEventListener("click", m)
							};
							s();
							r(i.campainha).then(function (n) {
								if (a.audio) {
									var t = i.audioSenha;
									t.src = a.audio;
									r(t, 5e3).then(e)
								} else e()
							});
							i.lblSenha.html(a.valor).css("color", "#064c4d");
							i.lblGuiche.html(a.guiche).css("color", "#064c4d");
							i.lblData.html(a.dataString);
							i.lblVeiculo.html(a.veiculo);
							i.lblPlaca.html(a.placa);
							i.lblOculto.html("ALL");
							i.numSenhasNovas = 0;
							i.numSenhasRemovidas = 0;
							i.lblData.hide();
							i.lblVeiculo.hide();
							if (h.isPast(a.data)) i.lblData.show();
							else i.lblVeiculo.show();
							i.ultimaSenhaChamada = a
						})
					},
					tocarAudio: function (a, n) {
						n = n != null ? n : 3e3;
						return new Promise(function (e, t) {
							var i = function () {
								a.removeEventListener("ended", i);
								e()
							};
							a.addEventListener("ended", i);
							var r = a.play();
							r.catch(function (a) {
								return e()
							});
							setTimeout(e, n)
						})
					},
					clearChamada: function () {
						var a = e;
						var n = a.chamada;
						n.lblSenha.html("0000000").css("color", "white");
						n.lblGuiche.html("00").css("color", "white");
						n.lblData.html("");
						n.lblVeiculo.html("");
						n.lblPlaca.html("");
						n.lblOculto.html("")
					},
					animarLista: function () {
						var a = this;
						return new Promise(function (n) {
							var t = e;
							var i = t.listaChamada;
							var r = i.itens;
							var s = a.sleep.bind(a);
							var o = a.animarItemLista.bind(a);
							var u = 100;
							o(r[0]).then(s(u)).then(function (a) {
								return o(r[1])
							}).then(s(u)).then(function (a) {
								return o(r[2])
							}).then(s(u)).then(function (a) {
								return o(r[3])
							}).then(s(u)).then(function (a) {
								return o(r[4])
							}).then(s(u)).then(function (a) {
								return o(r[5])
							}).then(s(u)).then(function (a) {
								return o(r[6])
							}).then(s(u)).then(function (a) {
								return o(r[7])
							}).then(s(u)).then(function (a) {
								return o(r[8])
							}).then(s(u)).then(function (a) {
								return o(r[9])
							}).then(s(u)).then(function (a) {
								return o(r[10])
							}).then(s(u)).then(function (a) {
								return o(r[11])
							}).then(s(u)).then(function (a) {
								return n()
							})
						})
					},
					sleep: function (a) {
						return function (n) {
							return new Promise(function (e) {
								return setTimeout(function () {
									return e(n)
								}, a)
							})
						}
					},
					animarItemLista: function (a) {
						return new Promise(function (n, e) {
							a.animate({
								opacity: 100
							}, {
								duration: 500,
								step: function (a, n) {
									$(this).addClass("spin")
								},
								complete: function () {
									$(this).removeClass("spin")
								},
								progress: function (a, n, e) {
									var t = 100 * n;
									$(this).removeClass("step1 step2 step3 step4");
									if (t < 20) $(this).addClass("step1");
									else if (t < 40) $(this).addClass("step2");
									else if (t < 60) $(this).addClass("step3");
									else if (t < 80) $(this).addClass("step4")
								}
							});
							n()
						})
					},
					forceRenderLista: function () {
						var a = e;
						var n = a.listaChamada;
						var t = this.renderListaChamadas.bind(this);
						a.listaChamada.lastUpdate = (new Date).getTime();
						return new Promise(function (a) {
							t();
							a()
						})
					},
					renderListaChamadas: function () {
						var a = this;
						var n = e;
						var t = n.listaChamada;
						var i = this.animarLista.bind(this);
						var r = Array.from(t.senhas);
						var s = 12;
						t.bloqueada = true;
						if (r.length == 0) {
							t.allItens.hide();
							t.bloqueada = false;
							return true
						}
						if (Math.ceil(r.length / s) > 1 || t.numSenhasNovas > 0 || t.numSenhasRemovidas > 0) {
							var o = r.length;
							var u = Math.ceil(o / s);
							var l = t.currentPage > u ? u : t.currentPage;
							var h = t.numSenhasNovas > 0 ? 0 : l + 1 > u - 1 ? 0 : l + 1;
							var m = t.itens;
							var c = h * s;
							var d = r.slice(c, c + s);
							t.allItens.hide();
							t.allItens.removeClass("aguardando");
							m.forEach(function (a, n) {
								var e = d.length - 1 < n ? null : d[n];
								if (e != null) {
									if (e.isAguardando) a.addClass("aguardando");
									a.show();
									a.find(".lblSenha").html(e.valor);
									a.find(".lblGuiche").html(e.guiche)
								}
							});
							t.currentPage = h;
							t.numSenhasNovas = 0;
							t.numSenhasRemovidas = 0;
							i().finally(function () {
								t.bloqueada = false
							});
							return true
						}
					},
					initRelogio: function () {
						var a = e;
						var n = a.relogio;
						var t = function (a) {
							return a.toString().length == 1 ? "0" + a : a
						};
						var i = function () {
							var e = new Date;
							var i = a.diasSemana[e.getDay()];
							var r = e.getDate();
							var s = a.meses[e.getMonth()];
							var o = e.getHours();
							var u = e.getMinutes();
							n.dia.html(i + ", " + t(r) + " de " + s);
							n.hora.html(t(o) + ":" + t(u))
						};
						i();
						setInterval(i, n.timing)
					},
					updateBoxMensagem: function () {
						var a = e;
						var n = a.boxMensagem;
						var t = n.mensagens;
						if (t.length == 0) {
							n.mensagem.fadeOut();
							return
						}
						if (t.length > 1 || n.numMensagensNovas > 0 || n.numMensagensRemovidas > 0) {
							n.mensagem.fadeOut("slow", function () {
								var a = n.currentMsg;
								var e = t.length - 1;
								var i = a + 1 > e ? 0 : a + 1;
								var r = n.numMensagensNovas;
								i = r > 0 ? 0 : i;
								var s = t[i];
								n.mensagem.html(s);
								n.mensagem.fadeIn();
								n.currentMsg = i;
								n.numMensagensNovas = 0;
								n.numMensagensRemovidas = 0
							})
						}
					},
					initPainelPrevisao: function () {
						var a = this;
						var n = e;
						var t = n.painelPrevisao;
						var i = function (a, n) {
							return Math.floor(Math.random() * (n - a + 1)) + a
						};
						var r = function () {
							var n = {
								precipitacao: 0,
								temperatura: {
									max: 0,
									min: 0
								}
							};
							var e = "/sap/opu/odata/sap/ZAPP_SENHAS_SRV/PrevisaoTempo('0002')";
							jQuery.ajax({
								url: e,
								timeout: 6e4,
								dataType: "json",
								success: function (a, e, i) {
									var r = a.d;
									if (r != null && r.Suportado == "X") {
										n.precipitacao = r.Precipitacao;
										n.temperatura.max = r.Maximo.replace(/\D+/g, "");
										n.temperatura.min = r.Minimo.replace(/\D+/g, "")
									}
									t.allIcons.hide();
									if (n.precipitacao > 10) t.icones.chuva.show();
									else if (n.temperatura.max > 25) t.icones.sol.show();
									else t.icones.nuvem.show();
									t.max.html(n.temperatura.max);
									t.min.html(n.temperatura.min)
								},
								error: function (a) {
									console.log("Erro na requisição da previsão")
								}
							}).always(function () {
								return setTimeout(r.bind(a), t.timing)
							})
						};
						r()
					}
				})
			});
		},
		"comigo/com/br/PainelDeSenhas/i18n/i18n.properties": 'title=Title\nappTitle=PainelDeSenhas\nappDescription=App Description',
		"comigo/com/br/PainelDeSenhas/localService/metadata.xml": '<edmx:Edmx xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx"\n\txmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns:sap="http://www.sap.com/Protocols/SAPData" Version="1.0"><edmx:DataServices m:DataServiceVersion="2.0"><Schema xmlns="http://schemas.microsoft.com/ado/2008/09/edm" Namespace="ZAPP_SENHAS_SRV" xml:lang="pt" sap:schema-version="1"><EntityType Name="senhas" sap:content-version="1"><Key><PropertyRef Name="Senha"/></Key><Property Name="Senha" Type="Edm.String" Nullable="false" MaxLength="7" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Placa" Type="Edm.String" Nullable="false" MaxLength="7" sap:unicode="false" sap:label="Placa" sap:creatable="false"\n\t\t\t\t\tsap:updatable="false" sap:sortable="false" sap:filterable="false"/><Property Name="TipoCaminhao" Type="Edm.String" Nullable="false" MaxLength="2" sap:unicode="false" sap:creatable="false"\n\t\t\t\t\tsap:updatable="false" sap:sortable="false" sap:filterable="false"/><Property Name="DataCriacao" Type="Edm.DateTime" Nullable="false" Precision="7" sap:unicode="false" sap:creatable="false"\n\t\t\t\t\tsap:updatable="false" sap:sortable="false" sap:filterable="false"/><Property Name="Guiche" Type="Edm.String" Nullable="false" MaxLength="2" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Status" Type="Edm.String" Nullable="false" MaxLength="1" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/></EntityType><EntityType Name="Filas" sap:content-version="1"><Key><PropertyRef Name="Id"/><PropertyRef Name="Centro"/></Key><Property Name="Id" Type="Edm.String" Nullable="false" MaxLength="10" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Idfla" Type="Edm.String" Nullable="false" MaxLength="4" sap:unicode="false" sap:label="Id Fila de carregame"\n\t\t\t\t\tsap:creatable="false" sap:updatable="false" sap:sortable="false" sap:filterable="false"/><Property Name="Centro" Type="Edm.String" Nullable="false" MaxLength="4" sap:unicode="false" sap:label="Centro" sap:creatable="false"\n\t\t\t\t\tsap:updatable="false" sap:sortable="false" sap:filterable="false"/><Property Name="Sigla" Type="Edm.String" Nullable="false" MaxLength="3" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Apelido" Type="Edm.String" Nullable="false" MaxLength="30" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Quantidade" Type="Edm.String" Nullable="false" MaxLength="3" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/></EntityType><EntityType Name="proximaSenha" sap:content-version="1"><Key><PropertyRef Name="Id"/><PropertyRef Name="Guiche"/><PropertyRef Name="TipoCaminhao"/></Key><Property Name="Id" Type="Edm.String" Nullable="false" MaxLength="10" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Guiche" Type="Edm.String" Nullable="false" MaxLength="2" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="TipoCaminhao" Type="Edm.String" Nullable="false" MaxLength="2" sap:unicode="false" sap:creatable="false"\n\t\t\t\t\tsap:updatable="false" sap:sortable="false" sap:filterable="false"/><Property Name="IdSenha" Type="Edm.String" Nullable="false" MaxLength="7" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Placa" Type="Edm.String" Nullable="false" MaxLength="7" sap:unicode="false" sap:label="Placa" sap:creatable="false"\n\t\t\t\t\tsap:updatable="false" sap:sortable="false" sap:filterable="false"/></EntityType><EntityType Name="LogSenhas" sap:content-version="1"><Key><PropertyRef Name="IdSenha"/><PropertyRef Name="Status"/></Key><Property Name="IdSenha" Type="Edm.String" Nullable="false" MaxLength="10" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Guiche" Type="Edm.String" Nullable="false" MaxLength="2" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Status" Type="Edm.String" Nullable="false" MaxLength="1" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Justificativa" Type="Edm.String" Nullable="false" MaxLength="150" sap:unicode="false" sap:creatable="false"\n\t\t\t\t\tsap:updatable="false" sap:sortable="false" sap:filterable="false"/></EntityType><EntityType Name="PrevisaoTempo" sap:content-version="1"><Key><PropertyRef Name="Centro"/></Key><Property Name="Centro" Type="Edm.String" Nullable="false" MaxLength="4" sap:unicode="false" sap:label="Centro" sap:creatable="false"\n\t\t\t\t\tsap:updatable="false" sap:sortable="false" sap:filterable="false"/><Property Name="Suportado" Type="Edm.String" Nullable="false" MaxLength="1" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Data" Type="Edm.String" Nullable="false" MaxLength="10" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Minimo" Type="Edm.String" Nullable="false" MaxLength="4" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Maximo" Type="Edm.String" Nullable="false" MaxLength="4" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Precipitacao" Type="Edm.String" Nullable="false" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/><Property Name="Cidade" Type="Edm.String" Nullable="false" sap:unicode="false" sap:creatable="false" sap:updatable="false"\n\t\t\t\t\tsap:sortable="false" sap:filterable="false"/></EntityType><EntityContainer Name="ZAPP_SENHAS_SRV_Entities" m:IsDefaultEntityContainer="true" sap:supported-formats="atom json xlsx"><EntitySet Name="senhas" EntityType="ZAPP_SENHAS_SRV.senhas" sap:creatable="false" sap:updatable="false" sap:deletable="false"\n\t\t\t\tsap:pageable="false" sap:content-version="1"/><EntitySet Name="Filas" EntityType="ZAPP_SENHAS_SRV.Filas" sap:creatable="false" sap:updatable="false" sap:deletable="false"\n\t\t\t\tsap:pageable="false" sap:content-version="1"/><EntitySet Name="proximaSenha" EntityType="ZAPP_SENHAS_SRV.proximaSenha" sap:creatable="false" sap:updatable="false" sap:deletable="false"\n\t\t\t\tsap:pageable="false" sap:content-version="1"/><EntitySet Name="LogSenhas" EntityType="ZAPP_SENHAS_SRV.LogSenhas" sap:creatable="false" sap:updatable="false" sap:deletable="false"\n\t\t\t\tsap:pageable="false" sap:content-version="1"/><EntitySet Name="PrevisaoTempo" EntityType="ZAPP_SENHAS_SRV.PrevisaoTempo" sap:creatable="false" sap:updatable="false" sap:deletable="false"\n\t\t\t\tsap:pageable="false" sap:content-version="1"/></EntityContainer><atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="self"\n\t\t\t\thref="https://fiori.dev.comigo.com.br:24587/sap/opu/odata/sap/ZAPP_SENHAS_SRV/$metadata"/><atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="latest-version"\n\t\t\t\thref="https://fiori.dev.comigo.com.br:24587/sap/opu/odata/sap/ZAPP_SENHAS_SRV/$metadata"/></Schema></edmx:DataServices></edmx:Edmx>',
		"comigo/com/br/PainelDeSenhas/manifest.json": '{"_version":"1.8.0","sap.app":{"id":"comigo.com.br.PainelDeSenhas","type":"application","i18n":"i18n/i18n.properties","applicationVersion":{"version":"1.0.0"},"title":"{{appTitle}}","description":"{{appDescription}}","sourceTemplate":{"id":"servicecatalog.connectivityComponentForManifest","version":"0.0.0"},"dataSources":{"ZAPP_SENHAS_SRV":{"uri":"/sap/opu/odata/sap/ZAPP_SENHAS_SRV/","type":"OData","settings":{"localUri":"localService/metadata.xml"}}}},"sap.ui":{"technology":"UI5","fullWidth":true,"icons":{"icon":"","favIcon":"","phone":"","phone@2":"","tablet":"","tablet@2":""},"deviceTypes":{"desktop":true,"tablet":true,"phone":true},"supportedThemes":["sap_hcb","sap_belize"]},"sap.ui5":{"rootView":{"viewName":"comigo.com.br.PainelDeSenhas.view.Painel","type":"HTML"},"dependencies":{"minUI5Version":"1.30.0","libs":{"sap.ui.layout":{},"sap.ui.core":{},"sap.m":{}}},"contentDensities":{"compact":true,"cozy":true},"models":{"i18n":{"type":"sap.ui.model.resource.ResourceModel","settings":{"bundleName":"comigo.com.br.PainelDeSenhas.i18n.i18n"}},"":{"type":"sap.ui.model.odata.v2.ODataModel","settings":{"defaultOperationMode":"Server","defaultBindingMode":"OneWay","defaultCountMode":"Request"},"dataSource":"ZAPP_SENHAS_SRV","preload":true}},"resources":{"css":[{"uri":"css/style.css"}]},"routing":{"config":{"routerClass":"sap.m.routing.Router","viewType":"HTML","async":true,"viewPath":"comigo.com.br.PainelDeSenhas.view","controlAggregation":"pages","controlId":"idAppControl","clearControlAggregation":false},"routes":[{"name":"RoutePainel","pattern":"RoutePainel","target":["TargetPainel"]}],"targets":{"TargetPainel":{"viewType":"HTML","transition":"slide","clearControlAggregation":false,"viewName":"Painel"}}}},"sap.platform.hcp":{"uri":"webapp","_version":"1.1.0"},"sap.platform.abap":{"uri":"/sap/bc/ui5_ui5/sap/zappsenhapainel/webapp","_version":"1.1.0"}}',
		"comigo/com/br/PainelDeSenhas/model/models.js": function () {
			sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/Device"], function (e, n) {
				"use strict";
				return {
					createDeviceModel: function () {
						var i = new e(n);
						i.setDefaultBindingMode("OneWay");
						return i
					}
				}
			});
		},
		"comigo/com/br/PainelDeSenhas/serviceBinding.js": 'function initModel(){var a="/sap/opu/odata/sap/ZAPP_SENHAS_SRV/";var e=new sap.ui.model.odata.ODataModel(a,true);sap.ui.getCore().setModel(e)}',
		"comigo/com/br/PainelDeSenhas/view/Painel.view.html": '<template data-controller-name="comigo.com.br.PainelDeSenhas.controller.Painel">\n\t<div id="app" data-sap-ui-type="sap.m.App">\n\t\t<div id="page" data-sap-ui-type="sap.m.Page" data-show-header="false" data-show-footer="false" data-show-nav-button="false" data-enable-scrolling="false">\n\t\t\t<div data-sap-ui-aggregation="content">\n\t\t\t\t<div id="painel">\n\t\t\t\t\t<audio style=\'display: none;\' preload="auto" controls id=\'campainha\' src="data:audio/mpeg;base64,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UE01a19WzWl8byr1Llaan68eZnIIncp6aUayuVcMss6WV0tFL+zssic3a5T27V+rqxemKtb612mu0v1r9Nnqk1c3///////KvMLeH8/////lXAGiQKAYkEv////AxIgACQwmtUFgwlgsBAwmGDMmGkmDerDmecgPA+4S5QoNoZBgWUlRCKLzOhxZCYEERIol1wQhOSafcHDaMX4COJ7mIogGRFXQmNCaK3L6lhdzImpM51zHvyyvbt1Gktma84T32sPz/l6KU9+L0juujCH6faR71vW+58sZ9t4ch19ZBDz7SOK6/XP1/Pwz7nhzDPspsWpVbs0ti1////++a13DnM+9w/mcNU87DNJPQ1T0UM0n7/////////vcP5n/cP5n/cKOJU9FKak/Kq85Kak/Kq/////gEiAABSbcbJZYEgSDTX6yKiIVNWrERHb/+5Jk5QAG4mBL9msAANgsyc3NYACH+CEXXJCAASsG5POYMAQdWCx4qdEQag08TA0s6IjqgaiwdWGolcInxFKugr+DX/6zv8qd4Nfgq4sG45bKmtQDakkSSa6VgBgJE1glA2EY+ucmIEBNQEBIMwKxEsFjxU6Ig1BpYLHirgaDViwW4iO6wW4i6zvEXKneDXWd4i6zvEX//yxMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuOTkuNaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==">\n\t\t\t\t\t\tThe “audio” tag is not supported by your browser.\n\t\t\t\t\t</audio>\n\t\t\t\t\t<audio style=\'display: none;\' preload="auto" controls id=\'audioSenha\' src="">\n\t\t\t\t\t\tThe “audio” tag is not supported by your browser.\n\t\t\t\t\t</audio>\n    \t\t\t\t<div id="corpo">\n    \t\t\t\t    <div>\n    \t\t\t\t        <div id="titulo">\n    \t\t\t\t            <div class="logo">\n    \t\t\t\t                <img alt="" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABMEAAAELCAYAAADQn5F4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAGRWSURBVHhe7Z1PyydFlu/rJfSuV3KbuQtheuFCcNEg0xexu6H3wwXbFzAXrBcwV3s/6tqhts4toRfVNdoIBVoLazHPolxoodiMlNBiKQ1WF26qwM1z/Zadmqa/zIzI+HtOfBoeyuaXGZn5iRMRJ75x4sSFC/wPAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgEAwgY+//OT86N9nX31+HvwgLoQABCAAAQhAAAIQgAAEIAABCEAAAhCAQE4Cd+/feyhsnX168/z1j66dX7515fyFd158+PfMmxfP//EPvy32Nz1H/+q5er7+JqHt/tcPEM5yVjZlQQACEIAABCAAAQhAAAIQgAAEIAAB7wTmQpdEp+feer6YuJVbONO7zoUyfYvEO+91xvdBAAIQgAAEIAABCEAAAhCAAAQgAAEIrBBQ9JREIkVUvXT2iimx64h4JoHs0ruvfhdBRvQYTQMCEIAABCAAAQhAAAIQgAAEIAABCDgkoFxb2sooIchSdNcRwSv0Hm3jlAD49u0bDwVBh9XOJ0EAAhCAAAQgAAEIQAACEIAABCAAAd8EtA1Q4o5EnqevPmtmS2OogFXqOm2nnPKN+bYQvg4CEIAABCAAAQhAAAIQgAAEIAABCBgkoO19U6RX6UT1pQSoHsuVKCYxkVMrDTYKXhkCEIAABCAAAQhAAAIQgAAEIAABHwQkzEigYXtjuZMp58KcxEWdTvn+Fx+yddJHE+IrIAABCEAAAhCAAAQgAAEIQAACEOiVgIQvCTFEe9URvtai07TFVPnVEMR6bSm8FwQgAAEIQAACEIAABCAAAQhAAALmCCB8tRW89rZpShCTMMmWSXNNixeGAAQgAAEIQAACEIAABCAAAQhAoDUBhK++ha81YUxbU5WbTTnaWtsQz4cABCAAAQhAAAIQgAAEIAABCEAAAl0SkHBCji+b4tdSFJu2SxId1mVT46UgAAEIQAACEIAABCAAAQhAAAIQaEFAeaVeOnvlfG/bHb/bFMh0wiS5w1q0LJ4JAQhAAAIQgAAEIAABCEAAAhCAQHMCd+/fO3/9o2skuP+DTWHriCCpwwy0VbK58fECEIAABCAAAQhAAAIQgAAEIAABCECgNAGivsYRvdaEMsSw0q2M8iEAAQhAAAIQgAAEIAABCEAAAhBoQmDK9SXx40gEEff4FM4Qw5o0Rx4KAQhAAAIQgAAEIAABCEAAAhCAQG4C2vJ4+daVcyVJR8jyKWTlqFedKPnxl5+wTTJ3A6Q8CEAAAhCAAAQgAAEIQAACEIAABMoSkKBx6d1XEb4GyveVQwzT4QgSTstaJ6VDAAIQgAAEIAABCEAAAhCAAAQgAIFEAhK/dBJgDkGEMsaMHFPUoA5MSDRFbocABCAAAQhAAAIQgAAEIAABCEAAAvkJ6MQ/xK8xRatSYqXyhbFFMn9bpUQIQAACEIAABCAAAQhAAAIQgAAEDhCQ+EWye8SvUkKYylVOOR2scMA8uQUCEIAABCAAAQhAAAIQgAAEIAABCKQRQPxC+CopfC3LltD62VefI4SlNVvuhgAEIAABCEAAAhCAAAQgAAEIQCCUgLan6SS/mgIIz0Jwm2yAXGGhLZXrIAABCEAAAhCAAAQgAAEIQAACEDhEgIT3CFG9iJHKPcf2yEPNmJsgAAEIQAACEIAABCAAAQhAAAIQWCNw9/49Et5/k5eqFwGI9/i2LnSCJNsj6bcgAAEIQAACEIAABCAAAQhAAAIQSCagSJtL776K+IMA1rUNKDddsrFTAAQgAAEIQAACEIAABCAAAQhAAALjEZD4pbxLirQh6ogIMAs2ILF2vJbKF0MAAhCAAAQgAAEIQAACEIAABCBwmAAnPiJ6WRC9Tr2jhDDyhB1u+twIAQhAAAIQgAAEIAABCEAAAhAYg4ByKynZeM8CyMVrT53//vovz9947/GHf2d//vn5x3/5h4d/f/vrT8/Pv7oQ/Pfg7k++u/fW7Ue/K/PlG08+fMav//ibrln0XE8t302nliKEjdFn8ZUQgAAEIAABCEAAAhCAAAQgAIEoAhIMLt+60pXgI7Hr0tkvHgpTRwSuGDFs71o9X2LbazefeCiOtRR4eHZYlB5CWFQXwMUQgAAEIAABCEAAAhCAAAQgAAH/BLT1sYe8X1N0lwQnRWjtCVOtf79z55GHwpiEut/96VcIYx0eHIAQ5r//4gshAAEIQAACEIAABCAAAQhAAAK7BFpvfVSklyKrJHq1FrRyPF9bMSdRjG2UYdFaNaLaEMJ2uwIugAAEIAABCEAAAhCAAAQgAAEI+CWgUx9rCBDLZ0j4uv7BY9G5u3KIVLXLUKSYRD59cwvWPPN7IQ4hzG9fxpdBAAIQgAAEIAABCEAAAhCAAAROEvj4y0/On3nzYlVRZiTha01oU5SYxD+2TbaLEEMIo1OEAAQgAAEIQAACEIAABCAAAQgMQKB24nttB1QUlKKhakdg9f68KUKMLZP1BTGdfDpAc+cTIQABCEAAAhCAAAQgAAEIQAACYxKoGf2lqC/lxepdiOrl/cSK0ybrimGX3n0VIWzMrpCvhgAEIAABCEAAAhCAAAQgAAGvBGpGf71840k3Ce5bCGTaLqlTJokOqyOIvX37BkKY146P74IABCAAAQhAAAIQgAAEIACBsQjUiv6ScCMBp4Vw5PGZD+7+5PyN9x5HDPtDeTFMbWSsXoGvhQAEIAABCEAAAhCAAAQgAAEIOCJQK/oL8etCUeEPMay8CPb01WfP796/hxDmqP/jUyAAAQhAAAIQgAAEIAABCEBgEAKfffX5uU7A+8eCUTTKX7UV+SXx5uO//ENRgchbBJh4idup70IMKyuGqb0M0j3wmRCAAAQgAAEIQAACEIAABCAAAR8ElOOopPilhPch4tb1Dx57mOjdm1BV8nvEa+8wgUkMK1nHo5b9+kfXEMJ8dIN8BQQgAAEIQAACEIAABCAAAQh4JqDtjy+882IxAUyJ2iVshYpAv/vTrx6+C3nCwrZLipN4SWQMYazrdQjBqIJVqe8mP5jnXpJvgwAEIAABCEAAAhCAAAQgAAHzBDRxV16jUsKA8n6tbdM7JdgoUmx6F90bIuqMfo04Tczu3HkkmJlYT4Jjqfofqdxn3rx4LkHZfKfAB0AAAhCAAAQgAAEIQAACEIAABLwRuHzrSjHxS+JKyNbHpYA1F3QkoMQIaCOKYeKjSLsU4VAnSY4kVpX8VrUpb/0E3wMBCEAAAhCAAAQgAAEIQAACEDBLQKfZlUx+/9rNJw6JV9O2vrlIIYFmRHEr9Ju1zXQp6hwRDhVBpu2UJQWiUcpmW6TZrpEXhwAEIAABCEAAAhCAAAQgAAFPBEpufzwa/TUJPqcikhTldETUCRWRrF93ajtjTP615fcTFZZ+kiSnRXrqMfkWCEAAAhCAAAQgAAEIQAACEDBJQCfYlYrGUaL1VLFqLT/V3qmH1oWso+8vLqfqUxyPlqn7iApLF8J00qrJToKXhgAEIAABCEAAAhCAAAQgAAEIWCZQ+vTHlMijSay5dfvRVYEuVdRJEYR6vvf313+5ykw8U95dguYyP1spAdVjuTpsgiT5lntN3h0CEIAABCAAAQhAAAIQgAAEzBH47KvPz3VqXQmhQeJUzGmEW6KMIsm23jFV1EkRhHq8V9y3eIlnjvdWtNk88X4JO/JapiIvzXUYvDAEIOCGwGeffXb+3//93+dvvfXW+X9evXr+//7jP87/77/+63d//+uf/un8f/6PnwX9/e9//ufv7nvx3/7tYXn6U/l6jhtofAgEIAABCEAAAkkEJv/jvffe+85fkM8g/2Huh2z9t3yWydf4r//6L/yNpBoZ7OazT2+eKyKlhMigKKTU7Y+TSHMqIf7ynfW8HKKOlzJCorTENcf3SnBb26pawra8lKm2p0MoBut2+FwIQKAigfv3738ndE0ilwSrUHEr53X/51/+5aGDO4ljereKKHgUBCAAAQhAAAKVCGgRbBK5JnErp0+xVZYW8SSgye+ZBLJKn81jeidw+daVIuKXBAoJMDnEla2E+KeEkI//8g9Zn5vzG2qWJfExRCjKebKmnsnpkfG5wi69+yqTwN47S8fvJwdl+luuxk2ra7H/Ts7GVC5RQHUNaIrsksPZSuyKcXIljMlJlf0hitW1FZ4GAQhAoCSBKdpnLoac8ilORfvMo3yW98x9F/03Y0fJWgwre/I9/v2Vfz/XuB7jB9S8dhLG5HOEfRlXuSFQOv9XiST1odvtcotvNYWrnM8KPcFRXHM+V2WFRKCFCHQjXUM0mJvutasPmTud821uMVvccjsm08qcnBC2y+UxF9WzWIpp7vpqUZ7EOwmpTGry2AelQAACEChFQOOP+muNQRI/NA61FkDmfobeSe+mLf9617t37yJ8ZDIGL76HfA7ZB7aRyTB6LUb5v5576/mgKKFYEUKCSolIrLUTDtfeL9cWv9ziUM3yYrYmlhAtdRBCrP2MfL2iMnvtM3iv/glMq2+T0NVS5EoVTZbb5fqnX/8NJQ5p0iHHzXJdh9jKJIjVp9z3E6ctrstoCGv/f+RJh77dWn0ded/YSOB55NCR5/Vwj0cBX/UyiV0SuqyPPfI1psU4RQSN3BeFjnayAYlFXhbcTvkgsgt9o8c2HFrPLq+TAFYq/5cEsFwJ8Jdi0dYJh6eEk9duPpE9uqmmgJX6rFjRsFQutdj3GFkE46RIl11ukY+anBCtblrY6hYidOxdM98uVwSqgULloHt3Pvdye0jkZaLyrbGq/e+1Gwu/6zsMNL/sr6gJ1ij9t/qtGIDWxRW9f8z39nit7FPC0LSwZqEvyfGOqrspKihWvO2xHnO8kzjIDkbpr+Z2pPFJonoOjpTRkIAS4JcSGXKeALkUgEIS4i+/S4JcroT8qYJUi/tjRUPxKyVgcnJkeI6wt2/foKNt2Ef2+mgv4eY5HNSpjGn11ruTOo/4ysnPelk4phcuWBcK5m2517631HupXbfeLlazD4iJqFCkUc13K/Esi8LuXPQayTb36l/Cj+pztNxRIwtfa9Fh6ptKjQmUW5BAyQT4SoReUnBSVNcR8S5nwvcWQtbRZ0rMOsKrZC41vVNoTrcj7+7lnmfevEgHW7AftFL0FPEzwla3PQc05HeJAXJSPeWQkgOqb/IidITU45FrJIZ6F0JP9VsehIJ5fVvpm3O9p5covpA2q3EshpuuDym352us9EmjRxfH2pAEMeUW8xqNPC26IYL+bLUPkg0ghsX06I2v1clzpUSC0gKYxLWj4omi044KSZbvO5qUvnT0HEJYWETY+198GOUwNu5eeHwmAnKa5VzhfKw7H6EOq9UcUjigx+teooLXicmpLsaDUDBvz1ZEgxzdvbYVhfZlHq6LiaBRG7b+zZok57CTUmUQ4XN8nFluk/My5rDoFm8TaucxfVup9ky5KwR0AmSpBPgS1UoLYBKiUnNKlUj43rNAJtEwRfAszQshbF8Ie+nsla4dKDrcfATkQI2aZ6HGREdRVBZySEn8kgBK1Fe8Izq3I/ETx3wttM+SPAgFy/Y/ysq6twi+vX48NjeW2u9emb3/Hpv/rEYvM0V8jZjTqbS9WF6AUX/kOcF96bpX+aNGo9fotw4/w4MAJrFJQluKqKP7exatcr+btoCm8KoRPYcQti+Eqf0ebvzc2DUBon3ShI6jTk2PjqomJiNtizpad7H3KZrSc2SRB6FgWacSq7vuuDO8nHI7xtqy9etj69WDSBOT/yyDWW0WMZ0gbN2OLLy/+uWe6n7LMGQXHtpaT3YxwgJc6f4qS/k6AVK5hVLEkK17a0SASRw6mttq+e4f/+UfhhHCJGKl1nsNXrnqNvVbe72fBPlZusKuCtEECMGjjQDW2xYGxK86duDVKfU4edFqelcdduaXkSg7YqRnzHYxDyJhbP6zzGb2sDgxJ7K4zhizFGHUxnuOakX8KmsX3hfgSvRXWcuUAPb01WeThZA1cUB5o0qdIriMijqa22r57jopMXfEVY/lpW4dnbiVTJA/55brfXsVslLeS9uYs3YMFNaMgJwO8nyVdTyOrAa2iBTSKvFo+YCO1E3Oe9T2YibizTqKwAd7EArW6jcQgbnL1O49Cpd77VRtL6ayPCwStcwRNOV12qsXfi/vj6i9q6+Osf+S1yJ+la/zebvyugBX0kaTy/YkgKUkxD8lPvztrz91L4RJ7EsRXub31uKFELa+NfLu/XvdDKDJndNgBZDjqa7DEevUa7W29rYFVubb2YTqu+XkNGf350EoWGuvLYTpnHVzqiz1M6MugsRExIhTbD/e2/WtEuJLbCGvU7vxZcsO1V+X7mO2ypdtjCjA99A3qE3W9jNb2lrTZ+tEuZIRYBJIamyTmyKFrn/wWDZBR+9eK7qpVYRY7u2Fyi1W61teu/lE1rrOJQS2LoctkU271EMPR/zq0xFtmX9I4gtOaB92YX111oNQsDU5iRFNDnXQDW7yLFpu1WXsQoOHAwNi85+lmiPiVx/jylY7aHVIgqKfEUbb24d8P4+LO6l9V9b7zz69WVxEKH1q4FJwyZHbailiKLqslrBT+zm5to5OzGokyJ8zyv3+rQWsHM/nlMis3WTRwhC/2jsbMSt/NbbH4YT2aROtV+ZTOiIPQsFWO60tIqTURci9I299jm1nHqLlaowrsjvErz7HllN9W+1IoMkXjfGHuLasPXmKRA8Z96peU0MAU6ROTVFHEWc5RIRlGTWjm2rykrhXgtet249Wq3d9Q+pJoCUYtC6zamfCww4RYJtbWQcit4NWIwG3Vn9HTIKdu65KlWd1m4IHoWCrTmu0zUOd/IGbvAuWe20zJh+SxKO98nr/PTb/2QGTepjwXon3e2fB+33rE8UKwUdsYn4PWx/79kU9Rjqn2mzS/TUEsBZJ5UtFBSmpf01xqtazJO6VEGtq133uPHAlmNQuU9uckzoJbi5GgESjfTsca454ydxQCnv3LlR4meConmqv0qd0Rh6EghDbSWHUy72eDy8IqcPY3FgeIuZKTnCJ7sHX2OrbZB+IozZspGQ/0cv4V+U9aghg2hJXewthqaimSbyova2zhhAmca+UOFMrQf7EKXdus1JcapV7+dYVRLAqPWr4QyR0kGvBhsOxnLDFTs7CreLCBUV/hUwQuaYf27EkhHkQCkJs33r+FL3/6FGgsXmQrPOKzX8WM66QU7Kf8SKk/5quKelrzO1H9mG9/cRw9XAtQlhMD3ji2hoCmIQVCRI1RJz5M3InxF+KFbVzXZXmV/p0xdpbYcWr9DfVErByPOe5t55HBEvsL3PdzmqsTWd07jSVSIwuu0AUtWsbVoSwUSY6licII58EOe9nY3JjaRJvfWJbYtsbWx/tjimy5xK+xtyXVV8zysKI9f7h1PtbHudyzakOlVNDANPkvVXEVImE+Esxomauq9IiWOk8WhJDa0cDilmpLbE5hKnaZRzqKLgpKwFyLdh2SCcnJGZyFmJArML6sIvec1F5EApCJzKWk+OzFfpnD7dlhfSd0zUetnHF5D8LYUNOSfvjSm5fY243pF2wbx8aDxHCQnrD2TW1BDAJEKXFm1PlS5yqITDUznVVimWpAwSWddBCECVR/m+/awsff/lJlFMZ2a1w+QYBVtt8OBslktSyCuvHNkrYR86O1YNQECqC9S5IrtWrooFCv9HzdTETOw957nJueyOq2MeYUrIPU/saJSrYcz85fVvJHLU5fZDmZSlBdg2BqEUesEkkevnGk1W+URxbbPXMLYbVipZStFnudw8pT3VUMt9ZjfaU4xmvf3QNEaxBD8xqmw+HdHI2cq3WM1HxZRdzRzs2l1GNbsmDUBA7manBNecztPUp9hs9Xq/JeQxXD3kUc/UZRBX7GVdihOCY9oLQ7sdGpv5ffab1PJgxNnzo2s+++vz86avPVhGIWolDSsCeQzAILaNVtFuI+BNyTW1ereyidI64UHtped1LZ69EOZaHOhlu+gEBD865x0nW0W/KtVovZ0VlHX0P7uvfic0llubqUkfsiyxNCjThpV1/265jt7J66EtzbHsjqrj/cSG0jccKwSHjBLkG/djHKTuykpc0xFazX1NTAHvjvcebRPxI9NGzawsNtU8+DBG3Qq+pzaulaFg671ltu4t9Hsnxs3erqwVy1LRPZyPHaj3bEHzaxtIpLXnS25GezINQEDqBnK4rFUlxhP/WPRLrYr/N8/Ux4qXEZussYvOfLW0JccPfmJL7kAROm/VnI6f6vdS+JPfY1kV5NQWwVlveJtGnRkL8pfjQ4uTDUJFr77oW2wRbJMgXh1q5z2LFqZrXd9EhOX8Jtj/6dDZyiBojRuNYn6CmvH8vDqkHoeBIPcRGFLUYmpic/nC8UDRDTD142NqVks8H+/Hpb8QIwXvthYU3nzayNibmWKzdsykzv9//+sG5IkBqTbRbbXeTyKHE67W+c/6cVicf7glce7+34qWtiXvvVur3WvnPWthhyDMliJvpvAy+KPk4/DobqSuzHiZrR4SI0e9JmeDm6gJHtb2SiaVz1A0RPD8eL2Ki98TPenLvlG1vbKH16W/kSrugPgob8WkjW36V+pQc26tzjHFNy6gtgLXcBinRRKc1hggBJa5pKewcFYxabQ9UtN7Rd069T1FoLaLfStjckTJ1MEbTTsnxw3E2fDsbKSuzo4oQowtg+v4cEYQp3aYHoSDFjlLYlb5XUU8p3+bxXtlrKHcPY+7RaEXyf/n1N3JF8uB3+LWRvb6/9wWg0D4+6Tolwj4yUT5yT8vTICWM1E7wvmTUUtg5Igy13hp46/ajzYSwkZPkc0JkUpe6ejPOhm9n46hDwQmQvu1izxGdfk+NIkzptTwIBaGcT12XIl6ncN+7lzHjx31DbDtRv5xiGz3ce8Q+sR3f40qMELzWz2Ajvm0kpO/qIQp9bxws9vuld1+tJoBJEJKockSMyXWP8nIdEe9y3qPthbm+p3Q5rbcFvnzjyaasWuSOy2lrR8u6fOtK8Cprsc7JWcE4G/6djZgtOpN5s9XJv12EOKLTNUcmuzm6Sg9CQQzn5bVH2m4O7ltl/OfVq+bFm5Q6Wbs3ZtKm7T4l3qFmmbH5z1hU8T+m5MgjiU/q305C+iltq80hqJYeD7OX//btG1UFodaChgSjHra4tT4UIFQ4ax01Nwk4LU/VbB0Jd1TESr3vhXdeRATL1ONqcMHZ8O9sHMnZggDm3y5CnND5NUejCVO6Kw9CQSzn5fVHt5ulcN+6d/TIvLX6jM2D5GE7YIxAy5gyxpgSIwSf6mfwScewk9BxUQsupcayLstVzp/UiXLs/S3FjJYJ8U9xah0RFyKEKXdbbB2XuH7kHHIleIaUiQiWp9vGIR3H0YidRGMb49hGqCM6XadTGvP0QGGleBAKYhkvr28hPq7VjqIBU7/H6/2xkzWJZtZZhEZpMKaMMabECsHLfgYBbAw7ien3WuckDfNUMl2lk9+evvpsVYGjtZAh0adVgvdTokMPUXF7QlgPUXNip/fYe9eSv48YDab+IVN3M3QxJDQex9mIPWVn9O1nMQ7aaNfWFmQ8CAU5bKSHwUr9iPWTDHPUxVoZMf2somVKvkuNskPznyGAjeNrxC64zfs1BLBx7CS2f4pdYOhhvIx+B50E+cybF6sKYBIxdNpeSaFir+w7dx6p+s0h0TatI+O2mClvWcg31LqmdR41iZa1vrWX50R3LtzwAwI4G+M4G7H5ObCN721Dgo+cep10pQiotT9tCZKTNopgUys3mAehINbZX7u+FvO1oRIhY3vMiBWH1S/nso1W5YREhWI34/gassMYIRgBbN021J/IF5Nfsfan30dZsBwiGkzbnGpPsnuIAmud4P0Uc73TnnjX6veeoubE7vfXf9mUVS/50Wq2XTSt4wQQOcZySmPyc4xuG3K0xCCG2bwljpJjLzQC5Hgv9e2dHoSCXAJFTO6lVO6n7h9lsnW0vmLqR/3E0ef0cl/otjfsZhx/I/aQhKmf4ZCNnz1cQBOHEGF52T/rnhEW4GL62BJjYNEydeJbzUn0tJWtdRSYnt/L1r4l/9ZsTolsvW7/UzRfK1FQz+1RSC3Znu/ev8eWyAM98ugiRy8TiFrvETpRkSkp2qnWe/X2HHHS94fmt9lreiMkDs/FaivyqDc7afk+KduM9ux173fGjW0hI/bgEQ99bcj2JOzme7uRjUyRxWKnhZYpsnitL1X053TNFA2kMnoVPI6IFCOMlVvjhtpIjijfEU5dPSqy7o1vzX9vkQhfE/QeosB629o3Fy564LMUlnoVe1pHzo0WDfbxl58ggkX23KM7Gy0nsK2eHTJRkRmNahuamIhRCUHHO9MjE56YLsuDUJCz3cdut4thvXUt9bAfyRMbGekhH+fetrfRD7RQe50ie0qMLypTAtm0FV/PUuSsnjv91czfd2S7mt4/Zx9pqSzV1V4bOtKHexeecwiGR7gWu0cRHbUT4fcSBdZbQvxl5E7rpO9LAaxnoaeH3HK9CoQlIsIQweK65JGdDUuOUe53DXG+5VTUdJZzf+PR8jRRKOGEzlumZyGs9KqsB6HgqG2u3RfX66df7dl+c9ZNzMTMw+mae4LsiHaj6CwJf0e2s6W31P0SpqgyidoSSnJHk8UKwaP6HeJe2kY8C2EtI6L3W9mBK5576/nq2yB7iQLrdWvfXLRonfR9LoS9dvOJJrYSKuK0ZmXBnkJZ7l2HCBbe2Y7qbByZ5GjiPV9JXf63pYl5iFMqkWxEASw0Qi68la1f6TkiopSI6EEoONL/7N0TI7ak2i7jxn4EmOorZsu56sTDBHUrCnSktjsJXzXbZWq7nt+v/luiWA5BLEbYGfWwBLX9kIXJ1Dr2zDe2v01lWfT+FnnAeooCsxC587s//apprqtJBOs5d9ok2PTASkn69wQkD78jgoV1zZ4Hw70J49bvErPkkEyn/sU6JtNWhGlVVWJZb2JSiFNqSdRLqe/pXtVRCJew1hV2lWwlxyQjx/fnLkP2H0Yh7ioPQkFu1iqv9BbUqZY0Oe6tPyvBM0eZsW3AOtet/Gej2I22sh09PCWuJ6x3tcbFo/1urDAx4mEJtfruyWI8i9FWRecftOZWecAkALTO3yRhR6KOFTHi1u1HmwthPedOm9ejorFaJsgfJRoMESzMOTrq1OSYHPRUxvzUv1jBK4z091dNiWw1OVLE0XSMdU3BKWSrmucIpVO2Jxto5Tx53R6kyWBs+wi53rpQUKrvq7EVhIWTsAiwqY5jxhMP/cBWhHHNMa5UG1srd8ofWSr6NaRfrHGNvi/Wb4wRgkc7CbLFwttkJ7H1WLtNHX1ezUj+Im3u/tcPmuQBm8QK5ZZqKVTo2dc/eMyMCKboota8FGVlQTTsQWC1wiqlPhHB9rtmDw730UFyuk9OQG8rtnIyJZRNAlmJKKG9VUcxSWVr6f6WAtjUUkvUcw91sN8TxV1Bv7UuwuzlYoojffrqEaM0jrajWBHYA9u1hQSviyolD0/J0V5LlSE/RfYd0jZChcHRctO29jtULyH1Z+2akEXeUu0iS7kvvPNiM0GjB0FHgpI1oeLOnUeaCWHWoptai6xWouYQwbJ0pycLGWVbwqnBW2KDViZjVujL1URYyVNujhwr6XunNI1mG60d0ckCvE4Sc28v9SAUlJxUhPUox67yGjlQqj5iFlg8TEjXJp8eF1VGFb+WPYf6960FnFAheLT8o734HV7HU0v+/Q/a1Nu3bzQTwDTp7mFrnzVRp/UW0pdvPNnUZmLFmjfee7yZYDhttdVplbHvbel6IsG2Jzk5xJRSE4dS5cpR24uAOjY1rHuXJkuKEjsaObSXEN+rU9TbFshTk4lStt+y3JxbEzwIBaXrIjTqIrbX0sJB6Xf3VH5sHiQP28BObXvzKG5I2CnVzmLbZS/Xr9lvqBCM39GmJr3267kX36rUzt3795pug5Qw0Hpbn55vTdRpuY1UUVWWxBm9aw8J8i0cupBSr4hg6122B2c7ZrLkRfw6VaPaeqIIopgcSVvO+2i20ZujFGPXVq4NjQQIcTJHs88jdRw66QzhPV3DFtS4PGCqt9j8bEcXNY7YSKl7TkVfhG6ZK/VOOctVHfU2ZsS049LXyreYi1lbhyTM38WrELNmez0txnpNkJ9z8a10u/mu/Ofeer6poPHazSeai2AWRZ1JrGjBT89MEUta3ds64lDbV1t9e43nIoKd7rZHiqSQAxaTkLXaQFfoQXKs9iZSWzmDvDpDFhzRySQ8RmjGRsRsNY89+8454bVaVm7nX/1CjMhulVvu946JFPKQC+mU2O1pG6RETbNbrAr5HGvFyhdRnxEiBI+WfiF3/5yjanP3fT2Ul3PxLQfj3TJab4PUxLxlXqspAk1b5WqIBCWeoUg6nWpZK5pOz7K6ra+H3HMXrz1l1tb27BcR7HSXO0rIuQbAUR3WLTFsawVyFNuQg7a3JXTXYSl0gdc6yIHL04S65CQhZ3J8j1vZSrKfyo6tAw+51pYRiF5sh+ivY7236j/EB/M65p3qZ3oVZlh8O2bj2e5qvQ2yly1qFhPiL8UInWpZSwSznuCdBPm/LSbC6YTZbB2Uk4JG2NKi1ccS24GsmYCcz2Wi9a2tCSNtR9g7GKBlXXuYDJ9y/nNsIfLKJrcoE7oFac/O1Yd4nBzl5n2qvJjtTuJc451KPuNUtKeHbZAjL6bt9Q85fh/BJ53aXc9+h1chMoeNVimj5WmQLbfyLcUibZHbi3Dp/fea+a6snaC5rLsW20fnNqdIut7t6ej7Vem4DD3Ey6rsliOvgTxk5dFQtSW/6vzkprUw/BFsY243PW5HmCraa86rVGHag1BQUoRYlh2zFW+tk/EgYtRkfnSy60EIWG5787C9s+dxItkx6KAA/I4OKuHvr+BVBNNW/n4or7xJD9sge9kKqS1yRyf9Pd2nCK3S0WAWT9Bc1lHt7aOn6sTqIQx79t59x1f5Bb1OrqeJBw7rukHJ2ZSTszYxHinCpufVWNWg13aa2j49CAU1BZlU0XGkPiF3vcRutfYQbbccWyzn7iOavI5zuoxUz90Oeyqvd7/DqwiWIwK9aGvQlqWnrz7bXPipGb20Jg5ZToi/FCRq5LvyIt7UEAy3BEnrW0pPiWHqU4p2XMYK95wMH4c1zRhHS4afKsak0d6/GxHsNCMPQkHNSVmKnSM4xp8EOa/bmImXh/53mf/M8tZ6+RMmokf2h5Kur/Bg9zH9eUp/XKMivYpg3R+M9dLZK80FME2iW29Lk0hh9ZTDtYgcRWqVigbzJBgqOX0pTiHletwSqe3VNQYOK8/wuqqPw5pugV6dn1MOau+rsZ4jwVISAo82YYqZXK1dG5uYfepJOHwgTQCLPQnVQzTMPP+Z5S1uqjsEsHSfIqQE/I4QSvWu8VofXYuPOr1tb0tTrd+ViytEMCh5jdVTDtfqSJFapXh5Ewxbn0rqJapuskVEsO8HT69RYIoMIf9XmpPkIW9LjGAQu00pje6xu70K1kdFGVH0IBTE2GmOa48kx5cAoPtyPH/UMmIjD6zzXi4sWI1kxZ84Nl4duWs0v2OZL+8Is9L3IIKVJnyi/GfevNiNCFZKrAkt1+OWNAkSJU4/VOSSN8Hw0tkvigmGITbozf4u37pCJNjf+1yPk2oc1jwDtlfHZ20CniNZeB7y66V4rZMUEcy6UNBKEIqxd8sRPK34nnpuDHMP207nCwtWbchChHDpcadm+V7HOPyOtCjaEv14SgR60Tbx+kfXuhHAauSv2hMivCTEX0aFlRB3vAk2EzOJe3t2Uup3b1si1b8U7cCMFO4xCgwBLI/xjbYaayEKTDXrdYJwVATzIBSUcO5DygxNji/xgpxr6RO42AmXh9M359sHLUaBkVIhjz8RWgp+RyiputdZPshi78T4uiQDnnb3/r0ukuFP4sMb7z3eTHyQqOEpv1WN0w91iEGtbbI1n3P9g8ea2qFyk9X83pLPOvv0JiLYN32xtygwBLCAATbwEq9iy5pDFJOsOhBhkcu8ihFHRTAPQkGIYFXimtB8KDBOF8BUf6GiozoODwtU8/xnFqPAEMCKDGGbheJ31Gce8sQS408PZR71O0KYHb7m0ruvdjXZLpnAPSRyR9FSJQWB1mXnFBlVV62/p9TzW59Qqnoq9W21y1W+wcMdlJMbPTjZ80FUDmvMVhMn1VjkM0ZbjZWwVARkgUJ7cBxLvENswnAvQkEJlqFlhkwAvC2UhLLJfV1sDjbLJyhO7Ob5zyxGgc0T+hfoyilyQQC/o0+TkICduz/spbyQMbBqrfSUDL+XbWje8ludigYLEQNDrvG6bXRi1vKABk8C4/2vH5iZ9JbqgC06pWsDJyu2ea1ktMgPK5Md75OEWCv2IBS0nAzsCTNsNc0TAaY6jk1+7WH70bQoZTEKLLa+Yvsurv8xAfyOPq3C84nA3YlgOrWtdlTI1vO0BSxEfCl1jdf8Vkvm+s5Uhp63jU68Sp6oGcK/p7aZ8i59DjV138pTMmkrIkbdGj72NG8Rgnsig6Wkx56E62W9HInG8yAU7Nln6d/Xomc9T3xKMz1V/jw31l7P7EHsnuc/syamHumL9uqU37cJ4Hf0ayGeT1/uSgR7/4sPuxLANMkukbg9RGyYrvGUh2lLtMix1c/7ttGJX4kTNUNt0kOknYT2foebOm9mzSndmrSwYpvXZjw7PKfsyEpCfNWy53wpsc6oB6GghRizfOapPFUSbDwtkrTmHCuqeNiCOrcrS2I1aRXy+hOhpY3md1jyW/E7Qq048bpn3rzYnQjWMhn5nTuPdMcjJfpm796U3Gs6vdD7ttEeDmrwkBdMOQcTuyrzt3tJrh07uTBfcRU+YLTJb0yERgX8m4/wXDexIpgHoaC1OKPnL5PjW9y61gPHrXeIiVT2wH++zdaaWD3PY9a6vx/p+Z7HttTI0NZ20Hv/mvJ+sX5HsbrQaW17IkmL31OEmdDomrXrRolsmupVUUZHmUmsbGEfLZ4pse8op9T7POQFe/2ja0OLYF7CzlmxzT8cj7YFypKIKrEuxdnr/d4YZ9SDUNBLfcy5i6uXBZJe+Oo9xDW0t/YQpT2PcrGU5ymmDwqtT67bJ+DB5mP6G0t+hzURO6YedG03bb7HKDAJHIowShUOjtyv57YQWFo/U9FvR3hpO2Xrd6/5/Bw51I5w9mCXo58M6SXsnBXbfecy9gpLE5ZYZ+fU9ZZsyHsS+BhndLRJUw5b3zpUZOoniK7Llwh/4h273dqDCDlPiF/SdnOXbSkqOHZs7/n60fyOmMjQ1vXmOQ+p+o8utqW+fftGlwJGy4ibkSKb5uLRkRxsOjGxpgDVw7NSouaOiF/ze6wLjqOfDGkpP8eak2tpJa21ExP6fM/HYK/ZUUyERijHUtd5nyjME2nvMfQgFOSewKeUJ9HCy+JICocS9yqSYs+ep989RGnPx2ZLwn2sWBlap1y3TQC/o28L8ZwP7FQ6gOq1oQnp01ef7VLEQGj4bZN6iU387iFZ+xFh7WjUXKoIphMqj7xvD/co4rR6J9fRA71sqYqZWHSEv+tXGS26JkZ06aHivOdMWeamWmPuQSgoIbaklEkEWP4IMNWHFpxi+g4PQuQ8ysWSWL12SmpM/XFtPAH8jnhmNe9IGVcs3BvqdxRjrvw8PUyOT72DJvupgsGR+z3kXUqpUyVfD+UmwSzlWZbvPRI1F8p16zrLyfFfOnslyikt1vE1KtiDk82KbRnj8R5ptHTILG1J8CJebznFoc6ohz7MwuSAd0wXxkJteurRPURpT9G1lsRqfIoyPkVIqaP5HadO4w3h1OIa7/nANMY19wN7jQKTOBIjxuQQF6YyRkuIvxSitA01NBfbyKxiOOW0T8vbT0dPiu/ByWbFtow75D3SaD6p17da2gppaVvRUfEk1Bn10IcdZcR96cJUTYYxY5WHQ0nmYpKlPiumnsqMvmOWOtpWyPmpqRZq3Hs+MI0FTXeV9Hoi5CTKKC9XTvEgpKyRI5vmYlgIewllEoIsR3OlvnuLBPnahpn63q3uHzkpvodoElZsy7hOI6z4zSe/1uxohNXyEGfUg1BQU4ThWe1Es5iDHtSre2jj8zZsZSuktbGgjAfQptTR+nNrtuY9H5jGx6aHYfR6IuQ0Qde2xBDhKuc1lrea5RQ2lHx9j+uohwfMOYdw2uN45PecdV2zrDZDfR9PtbQyuzZ5Y8W2jC2NtsXM0pYE1fgIUXohbduDUIAw1U6Yqsk+NLJR7dtDRMw8/5mlrZDWxoIyHkCbUvE72nAPfWrN/rLVs0JZZL+u9ygwTcxbiGDWT97LKWjsRTnB6tuDC1rYqcUIvOfeen7ofGDWV3WsJTLPPmgWLNDKqn0OR8nalgQPEZwh9bZn3h6EghAOXPOtSGZ5vIrtYzwsUM3zn1lJdh57cMFeH8XvcQRG2toe2yfEkcx/9Qi7A5q2f01IcwomJcqKPaXwSETN/B7LuZZK8N86nRNW35/c2SJBvsUTOS/fujK0CGZ9csWKbX5HZyrRum3EvL+1LQkeJsh79ROydcw6B02CRhKb9+p863e1UcsT5Ng+xvK3TvU4j+S0ErGpSKRyoyolbxEYbVEjtk9obT0j5AML8TuK1IPy8pQQTXKXmSpqxd6v0yhzf4P18tainCyKMCXrorZga9FW3//iw2EdHuu5F5qu2BQZBfspdIQVv/mE25qYamVCmSp67LUI60KBJkGWo5tS6jfmXtWz9fEqJs+Mh0jPZZS2le3bIXkI9/olfj9GwHobj+nTdK01v2OEsaqZCP7S2SsmxJ5YESvlehLifx/ZNBeLJLYsucLqx6xqn2RqMXfd/a8fDCuCWV/VaTZYHfPvTN1l3TZinVFLp0LKkGK/z+L1861UpxqPB6FA3zDCxCLV/iRMSDBMLafV/Yr2ixkALH/rxHie/8xKW7W2PS3GpixcO5LfYc3WRonSi8nbmK1N3b1/z4QAJiEmRdSKvdeiqFAysmle9jLKSdv/aj3bynNqJ8i3Zq/kA/tXs5OK5ie4ZBv9+ixohEijabJmLa/cKFF6exEZ1oWCKZIVEWw7Kb4mxtYnYNq2G9rT61utRE2tiYrLCb6VbcvNtkKFGofz60bqC61thRwlSi8mYjdbc1ReHgvCQm1RwWKi8Vr1OM959eDuT85hdTpqTnnSYsXXo9dbO5nz9Y+uBTum2Tq7jgpqtSqe47nWVtE6qvagV7G+zSzGxpqs/AXVwumLRjk9ays6z4NQMAkjI038Ytqlrp0iqKyIKGvfFxNpaiWB/FZdLqO0rSyq7EWfJnTb3BpAwLr4G9O/WfM7rC86hdZNgJnmv+Tpq8+aEMG2krIfFQ7W7tMpiLUEJYvPkegl8Uv8rIkvNXnXtFnlaqv5banP+uyrz4cVwaxsT1gbuKxF7+QfNcuWGOoweLhunry5LNU8pY+QSH1v+5gHoWASRhDBTkeCaUI8tU3LonxsxIcHe1hGU1gRN/aiT/P04JRyioDaugd/IvQbYoTxHizGch8cWidNIkHPPr1pZuJcU1AgyfvpyKa58DHlvFKEXqog4vn+WgnyLYlgEt57GFhavYP1lfWY7SWtGFt97ijb7eaRJlbqapSJwp5wYF0omIv41r8ldIIRe93Ux1vvj2KSX3to30sB29I3WVsQsTJuhbyn9XYe0781EVtCKmHlGuuL5qF10yQS9IV3XjQjYNQSwUjyvi+ASbSS+EXE3D6r124+UWVLpCUR7NK7rw4tglnfUsWKbYJHs3PrKLkf5BhZO1zBungd6oxubRWxNKle+965MIII9uNIsLlIaHkbTuwJxh4Sgy8XqCyNJ+VG1fwlt44IVr919O8UDQ+2Hzq+WVvEHcXviFmwyNKiLSXEl+hSSwSTaOE5Molv2xeucjKabx3NvW13Xp4lEUwRqFk6MaOFWJ94GcVu4rVHckatialWcuuETgaO5FCybp/LfIbW++LUul7eLz7TViHrCfFjRXYPW46W27ystNe9Ldg9Dd6WFwLWonyt2EmO/q5J8vUEA24tuOZgHlJGAqJjtyoxdc7JfumyaohgJHmvKxCVtpleylfEXEkBTGVbEsHuf/1gaBEsZEDo9RqS4h8bb0Pvsh4lGGO3oUx6uM66IBBaL3uTUetCwVIYQQT7YSTYfDXeeu63mO11liKm1tryKYHDinBvaYua5TF6LdpmlH7Qmv86it/RpP0/8+ZFRLBvxIO5OMH2PkSwEsLZxWtPIYJ9E80pti+dvTK0AGZ5FVHOd5PBqgcVpNI7jOKMWjtcwbogECqCbeXl8CAULIWRUdpbSP0vBULLEQix45TlbZ9T3Z4SOKzUYWx9VRqOTz7G6kLAlgA0Sj+I33H6IJSQ8aHkNdW3qOpkthKT/ZJl1ogEk1hR8hsoe1yR7c6dR4oKYVYiwUbfCmk9AaklZ7Wlo3z02aM4o9WdnqMV8vf7rERUpDqqW1tFrAsFp6LcRmlve3YhNvOtdNaTMW/ltVt2BR6iLdbyn+3Vey+/N0mKfWBMsNwutrYHWzlBNNVeY/qFA+aR/ZZR/I6YqN0skC/fumJO7CktgkmkQKQaV6QqXfeXzn6BCPZNJNjoWyGtJ7lEBMsyBK8WMoozaikfmIdJcsjkYSuRuAcGpyZAiGDfRgYsxU/Lguc8r1lIb219TFb9nRKRLEWdWxHBLG+F3FrgCBkfPFxjKR+YhzE3xGb2UjCE9OHR1zx99Vlzgk9pEUwiRWkhhPLHFtmUc65UbjALkWCjb4VUR209ASkiWPRwG3VDiNPg4ZooKI0vHmUr5FakgHWhYE0YQQT7sYCiyZdlMX4t+fdaN2Jly+BWv38qksJS1LkVEcxqu9g7KdWDT7H3DdbygY3id1TfFfDxl5+YFHt0yl4pAYGE+GOLU7XEyesfPFbMhi2IYKNvhZQTbj28GRGsrCKz58h5+N2aDVlvs6E2s7UlwbpQsCaMjFK3azZwqi1an3zFRHtY3t421elaf2pJuLYgglnOibglNHhoAyFjnLV8YKOMTWyF/HvC7BAhopQIJnEi5Plcg1iWYgO/+9OvhhbBRt8KKfnEeuSBNQGjrGSVv/QQZ876NRYmPFPNsiXhwgUPk6S17bfWI3NT+gJFRpyagFgWPPciXpY9tuXtbVPdr+U5smTbFsYEy1uEt4QGSxGDKf2dBRub+idLW5lT6qTJfMLaqZBz0aGUCCZxIkXc4F7EsVAbuHX70SJCWO+RYGyF/HZ4s3qy0N6qc345aMwSUxwKK/euHdPeY41bj4oJtYmthMHWhYItYcSSUBBal6HXnWqH1gXP2K01Vre3TXW8lf/MUru1IFBYtZU9oWEUEcxSHlJLUZyh482p66ofVGDxVMjSIljv4kGouMJ1NoS4l288OaQI9v4XH573OMmt/U4pA0Yv99ZmNsrzRnFGq4e/JxiQ5aiY0P5iL5G41cnf9P1bwsioItja1iDL0S6q75i+xYPAvZX/zFLUee9b1SxvhdwTGkbxOxLcgOq34ncUQv727RumI57+9tefZhcQSIhvQzzyJPKVsOM33nu827atgzgKdWnmig2dmPZ8nbaImQNv4IVHcEYtJae1HhUT2odsTaQ9CAVbwsiIIpgi40714dYT4scKKR5y7mzlP7Mkgu1FK7Uevi3byp6/NoLf0eQEwoNGO4rfsXUQz0F0+7e98M6L3U6UQ0QORW3l3BKphPghz+UahLKcNiDBKqcdq6yeRbDLt64gmnzTPXvZ529pO9v+qNjPFSM4o71PdubWYD0qJlQE2xKJLE/+9P17wsiIItjatiDrgmfMuORhLN7Lf2ZJBNv7lpajtOW8kCEnpY7gd+yNAy3ta/ls/I5CtaGk1Dkn8i3Kyi2CkRAfcauFHZc46bRnEezu/XuIYN/0616cjSYrOIXGxZ6K9TAx2xNeLOR+kU1Yj4rZq4fp961Jkgd73NsKNJoIttV3W96CExth6qHe9/KfhfYBvVzX01g8fxfL4nCIMOzFL92yY/yOn5330s71HiHibPb+QDl5Wkz4cz7z7M8/zxpBQ0J8RLCc9hlTVm5b/v31X3bZvhV9mr0zM1qgF2fDUmi5NVPpyVEp8S57E7de6svyxCem3raSBVsXCkKEEevfGFPXW/229S04sQsz1g+oUb3vbXOLsY0eru01cbnVaNiQ/k/jrRe/dMuGe7Wtpb+D31HQA9SWpJhJeo/X5txGplP6evxG3mkMYU6iVc4tkb2KYGef3kQE+3u/7snZiElAXHBYc1d0D5ORku9gxRn1MEneq8e9ranWGYQII6OIYJoQb+WPsnSS4Cm7jhmPPIzDIdu79tp/b7/3uEBiORo2pP8bRQTb6vt6ciKtj7khfcqe31GsPp5763nzos9rN5/IJhzolD4EpzEEp17r+c6dR7LZc4/f+MybFxHAZj26B+c75MS1YoPYAAWHOBGWr4mZrLaqbk/t9OjquAcGIROfUUSwPYHB8gmgsZHJHnLuhGxzszZOhAh7tccEtRtrHKf3Den/xNOy0BdaN7Xt5sjzLJ9AGloPuq7JQqiHfGCa5OeKntHpfD2KBrzTWKKcTibNFQ3Wo+28/tE1RLDZaOhpwtVzItsjDkgv98Q4Exav7YXz1ntYSih91Ab2cnJYFwpChRFPffKaLeytvFvfgrOX923e1j3k+gvd5na0b2h5394Wz9rjh9U8ebH+Wcs6L/3s0PZS27aWzxvB72gmdH/85ScuRB/l8MohGvScRLxHMYN3KiPOKUG+TihNtWkdGNFjHUl8bz2w9PR8bxOukNXonvhbeBfPjlCsY96ivjxEQIVMKrYi8iyfhjZ9e6gw4q1PXta9JoB7woL1Pmfv++b9iHXBT/Ubus0tpB/o7ZrQdltjbLAcIbUX+bnk15sd5HyfvUWAGra09wz8jj1Cib8rIqPHSfKRd8ohGpAQv4yoc6Q+R78nR4J8ldEbx0vvvooAtui3vU24LDgXiUNn9dutT0i3nFcL9uKZ/1Q3eydleRAKQoURb33ysv3tLVRYnujrW/ciGpcduNXInnm9hm4pzykk1CqrWaTIiZHect8QaiPTZ3vORYXf0cfJkKHifRGn+6WzV7qbJB+dtCvqJSVypkfB4CgL7rMv5uWIbuwxsvHu/XuIYM5FMDnGe5OsIgOa40KtJ6i2LIKNsBobEhlkXSiIEUYsT3T3hIkQDtb7m5j8MtYFP9V36DZfDZF79tHr77ECTil3wKowdET08bz4E9IPlrKhkHLxO0IoJV6jBNVeBJPrHzyWJIL1eoqel/rhO+KFuVRhtzebJgrsdIftccIlRzE06iJxGBvido82Mk22jjjnNSvd80RgqoM90dqDULD3jXOb8treQvtlywnxY7dXWxf81IZjtgv2KnLtvVfTiJG/dw5KKr/3nr3+HmMjU19oPQfkVl3sRT7X9DFOPWsEv+OITWarFy9J8SdxJSWZOAnx4wUaRK3yzFJsWlGRyi3WUz0pB2G2DsxRQV4nXL07GZZMyPOqYM8i2AgnM4Xwty4UxAojXvvkkJPhrG97jR13LAt+muSHRHHOx7peRZq994r9zhLju+V+8MiipNd+ULYW20+UsKe1Mj37e90sfnpJij9N8i9ee+pwJNhrN5/oSizoSbjgXcqLXVuMJdAe2ebbm7D7wjsvIoCtjHieHY2YbSk1nQxrz/IQibM2yQkRYVrVl9WtL3sTyul3TSxDthlZFwpiJzwe++RQBtYjEELseepPPIjcsdu6QvuGHq8LteFS44XV8SDWRiZ+nsWY1ra0ZaNW7Symz4jpp4u0Z09J8ScR4YhY0GPEDMJTW+GpJ/7K63XErm/dfrQrYZcosPVu3OOEaz7JPrICWWTQM16odSHCmgjmuV1OdRFyWpgHoSDW4fZW96E5o6yL7bEJ1HV9zMStx2tjF5p6/IaYd4pty7mGfcv9YMxW8Dkv6/2Bxe2Q3saeU3XQhQB5+daVribJOYSHIzmUSIiP4JTD9kqVcTRBfk/RjUSBbbthmojGOIHWrtUEDCHshzagiUtsPgTrERqWRDA5/15Fx9jtCNaFgiORhta3BM7bWmi0n3ooy9u9YnNjeZjgx27zVR1b8x+W73ukPecQwqzmx1L7T/l+r1FJsYJ5CsPQe/E7QklluE4T01IT91blHoma0TbKVu/LcxHgQmxAUV2x0WA92TVRYNsdtueQ88mBRQj71gbk5EyiQuyKttcVwlQnPYM79KMivAqOsRGaHoSCWLFZxuCpT475fsvCb2w/4mHxKSSSc9m5WT/lVX3Yke9OHSesto3UAwWsL4JYWnwbwe+I9XtT2+3q/U9ffdad+KPT8GLEgjt3HnHHIERU4Rpb4lusXasN9FLHnAi534V7mnBtrTKPLIRp4J+vJB9ZzfZsJ904Rt80Vw+T471oj9DtMdZZxAojU2/tpa3FRDtYj36Lnex7iHA50m96mGirXYcc8rDvfYVdYXkrZCon62PA2lh4dGwIs5j4q7xynvMP9Tvi6R24o5dJcu73iBHBdPpe7udTni2ByUp9xSTI7ykf2N3795JCsQ90beZu8TLh2pt46/fazmtrY9Cgf2olNSY6Y/4NVlej92zjKI/c9asJw967Wv89RiywLhSMnBA69jQ96xEfMZN9D+08RuCc95MeRDD1wTUX1axuhTyyXXY5pnqIBl4bs2P6jNy+xrw8vYdX325if3QsLsL9s68+dyv+hOYFe3D3J+e//uNv3HKwIu7wnmGioXJ8hQq8veQDIwosrPtWvizrE+vY9+8iMWZY9URfJYdGQsOagBA7OZ2/gFVnfM8+jkTGRVfMzg1qh9ZFn5ycPQgFRyc5HhYmYhKmW5/ohib+n7oAD/3o0YUDD98+39Z9tI2Hjh+W/bNc20a9jos9+KGyLw9blE3tAlGOHq/iQ2heMBLih4kvXu3E2ndJsJVwGyKE9ZAPTNut73/9gCiwQE9rb/Lq8XcN/DETtUCU1S+TE6OIry3ha15/KSti1rcsbdlxa1vwEiGxxlgTmZgDKqxPlmOFkXnHYV0Ei4n203dbzzcYM9lXG7AedZGylct6XZ/q30qKGZbH3CPbZU85UNYPzNjaEhkzJpZwLq2Ps3tzk5iDWUrwPVnm2ac33YpgEgCsCAXWhBjet61wKOF2z7a1bbKHenr9o2sIYBE9uveVoK2BUuJDawEkoqouTKKXHO8jwknKyrWHCdyWSBNTDzmvHcERjbE7D3YWI4wsbcmyCHZkm5j1SI+YiaxlUWPqO2NFzrl9e809JBs+Gh23NZZY3SacM7raQ1Twmt+RsiiZ6oN4FRfnrGP8jlSewfdrgtrDRLnUO+xFzGjLZKlnU25bocgz/xCBt4cIx2fevIgAFtwbf3uh90n43mqRfpcTKwc91+plZBWcvFyTYUV5TYJX6mQxR44Oz7aSIlwcrW/PPKd2F5uQ1oNQECOMeBLBYicdlpN+y75jJ7FHFi5Cxq+a18TWsacoxz3OGmMlLqQwmnhZ3gqZWxBM9X326q3l7zlsJdb/8DDG7tVZbhuMZbx6vXcRbC9ihoT4CFVWxTKdaLoVDfbyjSebC7zvf/EhIlhkb+11dXZvkFz7XdEMcmQ1QSslisnxkcilP4lc+tOqryZJpbbL5BB5LEephNhDTYd0BAHsiCNqXSg4mjR86rattrEj/YvVSJcjAq/13Gf65pRtvrJvz1E9y/FF47j6MvkS0xgvn0LtO8SvsOyXpSwCnHJfPW6jnezlSPRspIv/g8tHEMBSolVT2Abde/nWleYT5ZIihISANaFAUWIln03ZCGwlbUACbs+2/cI7LyKABfXCP7xoJMc0RAg5dY2cWf1p0jY5tKf+lbAxXTv/t4ctp7kcU8+rsrVOEB1BAIuNklGv5EEoiI188xAJdmT7k/W6jo2s9bD96IiovbTvo2Owx/tkQ6f8CtlKqcWw0hyP9Pt7bqv1vmKPeerCyR6/6XfPYuLEuIT9hfINuk4T1ZIT9R7KXtsSef2Dx9x/ew/8eYdyYuCabfewFfLu/XuIYEG98I8vsupw7TkX/P6zh6d/5nSyvK8kqi2kChlrzVDOfA+CaOl2cdQRtS4UxAojp+zEWiTY0eTD1idksQnRPSwe5FhIsR7pWbrvtF5+qbHT+8JRyYgwtVvv/HL7uQenUvu3jSCCrW2J/N2ffoUI9odyAg3iV3m2EnJPRYO13gpJMvz9vnfrihEGSOvOZcr753ZMRxBN1SZyTPqmdqc6GIXb0d7IulCQYxuGNRHsaN9iva5DtrTN235K/93DvUeF7WVfYF3o7qEuen2HlJND98YM79FgqlP1ibkPatJOjxEW3kqKiHu2GfX7CCLYqS2RJMQvL9AggpVnLCF3KYK13uZLMvyoLvjkxd6je3p1Gmu8V47olKXRWI/iCOUup17fmiKGyXkfJfohZaJsPUm6bCpGGFnrtS2JYEcjTK3Xdez2Tw+LTEfFzqWdW6/70LFjxOtyLAJsebOjjKP6ztT8pPJZRvHTzAhgMu4RRDCJMcttY60jZRCIygtEozC+dfvRHwhhrbdCfvzlJ2yDTNTBNGCOEKWCY5poKLPbrUdyxNqCJrKawIUKYnJiPUx+QzmlCGAyK+usYoUR6yKY2n9oW1h+q/WE+DG5sSyf8je1/ZwLKR54hPaJo12XKtzseScjRIPNbUZjivqamH52Er9G8edNCWAjiWDzLZF/++tP2QbJNkg3NrCMdPz99V82+zYdtLE3cPJ7GAHrk9DRHM7Q780RnXLKgkaOHpTjpfaildbpxC9F8OhEL62Gj7D9YG5/qQKYh4lxjDCy1SNbiQQ7um3H+kRWk8uYSanlU/6mNh6b/2zP4xgloid0jPZwXU6hlNQd3+ZyXQpic39j3gdJfJQfonF4FPFLbMwJYCOJYBevPfVdtMwb7z3eTCQYJTqJ76wb6SZhV9siWwq82gZ5/+sHiGB7Hmfg71YmXx4cxlrfkCs6Zc2EmMz82FmtVbe9PCdVAJNtWRcKYoUR6yJYiihifYtOrL17EMRzL6RYb++99L09vYfqNNDVTLpMtjiS0NNTHff0LiYFsJFEMIkyd+488lAoICF+XYEGQaw8bwm7su3Xbj7RTOBlG2SSL3HyZg8Oe08Ddet3yRWdsmZpWoFs/Y08v50QFysIrNmR9X4nFwfx6X0xQnWVMvJY30Yds+XLQ/9YYiHFQ+Qn484Px53cQulWH4OI2m7M78Hucx9alDKeRd87Sk4wCTGXzn7xMDeYkuL3+Kf3aykY6fkSU2L/tNW0FU9F+LVgpue2+uZTz20t8LINMrrrDbph5C1uPQzuOd8hZ3TKlvFYj+zIyXykslKigeb25EEoOLo18FS76lkEU58SIwItv6/nbwtpu7FbvjykGCi1kOKBTYjNjHBNCaF0z2G1vnAygl2U+MacC057Nlbk95FEsF//8Tc/SpC/PFmv5f9vvU1T4krL7z/y7Fb5r/TcI+9b8p5WCfHZBlmka/6uUOsr9SUGXotl1nQWcEjHWpnNOTG2PhmOFUb2eu+ec2albnmyXtex329925bef89ej/5uXRC16BOUeuec40GoPUmMt96+StWH13JLnz4aantJ140kgili6PoHj3UnXkzCCCLYhei6QQT7nlkrFp999Xkxxyypc3NyM9FgPgSNlIiNWFMmT4cPm9lznjXpyBn1JDuzPpGJFUZC2tZePbT4XSc6hrz72jUetsDFJMT3MI6WXkghp6SPcSOmXaT0Ict72Rbpw35CxrMWQmtOW/2urNFEMOUDKxmNk1I2Ihgi2FH7aZUQ//WPriU54kU6NYeF4pzadi5yR6eEmLiHSV+IMzbqNYr2yy2serCZErlwerOxHFurrU9YY0VAD2No7vbubXtsb+20xfuUFkr3fA/r0aUt6szSM0ssvO3ZVNHfRxPBFA2mbWNHxYaS9yGCIYIdta8W+eTUdxTtnCj8OwJsVbAtgpWITglpHgpXt+Rg8a5hdq4JfYnVfutCQawwEtKGdE1vdvnee+8lj73Wt9nHMOh5S2uobaUegBBq69b7gFCeXq+LaRehNhFzncYl0jGEjePWbLDEwluMbRW5VgmtWyQWb/nMHvM5SfxABEMEOyKC6bCH2u3p6avPnt//+kGyI16kU3NaKIKGXceihGARauaszNq1m1NOcq4E+Ev78SAUlJoA9jRZyZGHxfqiSmxkrYfDQmotpHjoB3pqrzXfpWTOuFB/Q9eRjsGXzyEbNn0C5JbxajtT7Ql0D8/rMQk8Ihgi2BERrIXdfPzlJwhgMV5BhmslpFhfva/pEPbyrFLRKaEmxcqsD4e09DYE60JByQlgL32J+v8cgrp1YTxWCPQwbuao99Axw3pf0Et7rf0ese0i1B6OXEeifB9+h2y4lgB/xM6S7xlVBOsxGqyFmDEXJHsUBvdEoVbJ4HuxH0WB6dTTmsIyecCSu93DBVhfwa/tFPbwvFLRKTFGhBBm2yEttf1xbkPWhYKSE8Ae+hG9Q46cUB4S4sfkffMwZrZYSGFLm70xI0f/EONX7F2r9+ml7+Q94u1ZPkFvNrVnc9G/v//Fh1Un0DUn63vP6k30QQQjEmxP9Fv+rvx2e3ae83fygEV3sdlvYJU2fjBv5QDFbtvJbiyzAhHC7NjN3F5rrMJ6EApKOuut+o/5c3Ntg7WeED82N5b1qDfZQIuFFCJ5bI0XPfkacz/Gw2ErPfT/td/B7fbHpZOtbU05J8mWyrp47amuEuQjgiGCxYpgOu20Vpt75s2L5AErqVJElE3yWhsOasnolAhz+e5ShDAbdiOHt2YSWutCQawwEtt2ak9Als9Tfx/7zmvXW4/406Q6lIWHqLeW4gYChp3xosZiSWi7W14nO9J29db9KM/ft2fVUwvR/ahtJd+n5Na1JtE9PqenkyIRwRDBYkSw2lFgn331ebDzmdwxUcAmAcSM/cG8B4cnZttOLZPHdvq2HTmhuaJ+QmzKg1AQI4yEMFle07IvkT3k6kesR/yJRUxuLA8iTuuFFOsCecu2W/PZufqII/1jyD1EFvbtd8hWte06pn8NqXcT1/QoTtV6J0XSKK9SjPhQ6lpEMESwUNuqnQvs7NObCGCd9eY4FX07FTmjN0qYHpOb/uxHNlN7MuNBKCjtuNeczC6flVPgs97m9f4xfaGHvFa1+4NTfDU5btkGePb2WNW7rzHZFD5rfz6H2paiTbVAEtO3urr2ubeeHzoaTOJTqPhQ8jpEMESwUPuqaSuXb10Zt3PsvKfHqejTqZBjkXPyWsoMyS/Xh/3ICW21BcG6UBArjBxpS60m4TkTonuI+IuZqHlIyt2LuEH0cB/jxFo/ZMHXmPpdbKkvW5IPWHoR6ciYW/Wel85eGVoE0+l6f/vrT5sLYTWFjVORdr0dFBAiCI14OmTNKDD1DVU7Ix4WTQAhrC+nQo5q7Lad6ErPeIPEF/J1tLGhaetjKyfUg1AQI4wcbTYtRLDcfYj1iL/Y3FjaRtii3nI+sydxA/GizRgRYk+txo+j/ane13pUaki99HyNFlh6iDI9akNZ73v9o2tDi2AShF6+8WRzEezW7Ueb1gMi2G+D+Ut8CxHpSlxz6ewXwe+Zsq1YEaLKGZi1s6GwIgQQwvpyUGtEp+Q0JDlD1iOCenY4T72bbKS1E2pdKIgVRo62mRa2lVvcs96+YxN/Wxf2c4ugR21/fh9CWF9+hvola77G3J5ImF/fnhRdmntsydG3NC3j/S8+rDKpTpmQ17hXIlQJ0SK0TIlQNb5z7RmIYP2LYHfuPFLFRp6++uz53fv3EMCa9sxxD8dBre9QrE2OJUrG1V4fV7M9srwN9SB+TdZmXSiodYBAbREsdzJ0DxF/MYKxoltr11nu5/UsbhDFU36cCLWnVtvoc3ks6pusC/ShddXyOi0Y9RRZmst+spSjyW5L8aWXZ2tbZMsk+Yhg5ATbE0xrbP+UAMZJkFm61uqFEGbe3jmtFZ1SyrhwSsvYUE/il2zHg1AQI4yktJeakxdNCFPe9dS91kWL2NxoHhK59x6twYJJmXEipq/RIkbuvqJVedhTGXtC/Aq0aE18exGjWr6HtprtCRGlfkcEQwTbsq3rHzxWpY0qMjSw2+CyTglo60iMM8W1+RyQ2G07nZrQBTml1iOFerDr3sSvyd6sCwWxwkhKO6tpR7mjSLUwYr0dx0QwSBitWV8lnmVlIYV8kvn8hhg7kn0oWjR3X5HSR+a4lwW4fPakbY8x/WaO+jNdxujJ8efCW6ttkYhgiGBrIpgOblCkYmmB+OzTmwhgpnvy718ehyKfQxHioGqi6UUAm6xIE0rrUSQhdZf7Gk1Sej51yYNQUNPBz20fa+WV6D+sJ8SPjXbxsABUwg5KuTUSWa0L6rXad8pzvApfp+ySXGHHfVe1xd6jSEv1RUnlkhz/+3xQrbZFIoIhgq2JYDW2Qb59+wYCWFIv2ufNcqitRwKkOI+l7219wl8Nq5NTpZXF0iytl29l9dW6UBArjKS2kRo5a2Q7qe956v4a716y3cbmR5NYUPJ9apRda5tvTntTVJgH9jXqN/QZIwlfS1uUuEo0epgYNvmgFvuNnH1QUlkff/lJ8SiT0lEsOctvcVokIhgi2CkRrMY2yEvvvlrEAU/qlLg5GwFyhYU5E6HOqa6Tgyoxwdrx5ClGhRj2Yzuaor4sOaDWJ6u1k4aXFoBLnQToISF+zJYv9U8xfXiP19bc5psyFpy6F+Ei3c+QaC3xJ8buc9djT+VhU+s2pb7C+sEIPdnaBfKC/fB0QIkPpfJ/nSoXEQwRbGkXNbZBIoB11Q0XfRm2t6U5qZqsagI+erj5ZEejRhhaXqH3IBTUniCWFsFKTWSsb2WOPSTA+vdKlCtlC0Udi0XhCBfhfobGUIkZ2gJoaSGlpj3pWZNNWV/ASRXe1SeOtvhazdbIC/ZDEUyRZXfuPFJNCEMEQwRbimAXrz1VNEITAaxa99rVg0YXMWIcEVZm101XjqkcMutbrkLsQd/oIRmxdaEgVhjJ0fGWFMFKRbWNlhDfw/fW3uabo23slSFxZ4TxIWQMma5Rf6Jor9EX0/ZsZ+132dRIeehkL/KzEEmPWkzgfUqKnXNLoYeyauYHQwRDBJuLYK/dfKJoe0QAC+wYHV+miQNO6g9XbScHVSvyI211TDVzOWgSibxMeDyu0HsQClokDS8lgimqoVQfYz0hvgSDGDYevjc2/1lqn13zfkVv6vtGjORB9CpjafI5PC7CqY1ocQQftIzdrJZ69/69opNuq6KYonFqbItEBEMEm+zs7M8/L9oWX3jnRXKAVe5fe3+cV4dia4VWzqkcc02gam+x6t0eUt5vsiWt1lrZMjk5nnKqvdqCB6EgRhhJseH5vaVEsJKRINbF6NgIuVJ1FBPhk3qt135n2Q71nYqEsm6jp+pb3yTb9TyO5OpXc5Yz9zlS22Ht+yffgy2xOS3iYFnPvfV80cm3VSHs0tkvigthiGCIYBLBtAVXEYil2ora+P2vHyCCHewjR7hNDoUGZDlzXlZuEbzaWa4mPZoUyJ56mPjIFvQu05aUFsJKi9pQu5bwYvVvFJEgh21YrePpvWO3/lj/3pKCaA57KlWG+l5FvGgxypKQqcWduU8xav2VsovUclUfGt9VRz0txMmf1uLgaL5Han1Wu//t2zeKTb5LTeprlVs6UT4iGCLYg7s/QQCr1tvxoFACk6OqgVsDeA9Cxtpq3dI5ZeIcWst1r5OTKqFVNiVBSs5qLrtSWXOhSwKcnhc7sa5LhKdBAAIQgMB8bMg5LsRG+EiwmI8jGq8Qu2za57QANPc3SoljS7uRyIvdGLEbtkT+ODn+XGTTNrVSWyMRwcYWwSSAlUyErxxgRIAZ6YiNvOY8skTOxfQnoWwSIkr9O3/eFAUwSkSPEfNIfs3Q6A7ErWTUFAABCECgawIa36cxYVpAOepzzP0H/fckVCBWdG0CRV5u7sfKDpa2sfb/J1F0sskiL0eh9QmwJXJbCCt1YiQi2Ngi2Ms3niwWhUkS/Pr9KE+EAAQgAAEIQAACEIAABCAAAQMEOCVyWwRTvqYSQhgi2LgimHLOldrWiwBmoNPlFSEAAQhAAAIQgAAEIAABCECgDQFtmXr66rPFJuWlJvs1yy0hhCGCjSmCIYC16ed4KgQgAAEIQAACEIAABCAAAQhA4CEBRY/UFJUsPiu3EIYINp4IVlIAu3zrCidA0p9DAAIQgAAEIAABCEAAAhCAAAT2CHz21eeIYH/Y3hYp4S6nEIYINpYIVlIA05bmvTbO7xCAAAQgAAEIQAACEIAABCAAAQj8ncAL77yIEFZRCEMEG0cEQwCjm4UABCAAAQhAAAIQgAAEIAABCHREgAT5+5Fg0zbOHBFhiGBjiGClBDDl8VMEZ0ddCK8CAQhAAAIQgAAEIAABCEAAAhCwQ+CZNy8SDRYQDTZtjZSQdf5VvJijexDB4rn9/vovm9innhtbzw/u/uS81PuqnSKA2elXeVMIQAACEIAABCAAAQhAAAIQ6JAA0WDh0WBTVNjZn38eLZAggsULYGJWSlTaO6ghVgT7219/en7x2lNFBLvn3nr+XCe6dth98EoQgAAEIAABCEAAAhCAAAQgAAFbBIgGixfC3njv8WghjEiweCHMggh2584jDw9Q2BPWjvyuU1wRwGz1p7wtBCAAAQhAAAIQgAAEIAABCHRMgGiweBFMgoZyP2kLXOi2OUQwfyKYogKPiFsh97z+0TWivzruN3k1CEAAAhCAAAQgAAEIQAACEDBKgGiwY0KYtsBpK1yIEIYI5ksEK5kAX8K00a6E14YABCAAAQhAAAIQgAAEIAABCPRN4OMvPykW0RIS9WL5Gm2FC0mYjwjmQwQrmf+LBPh995O8HQQgAAEIQAACEIAABCAAAQg4IfDCOy8ihAWeFHlKtNvLE4YIZl8Eu3X70WL5v9T+yP/lpDPlMyAAAQhAAAIQgAAEIAABCECgbwJ3799DBEsQwSSMKZH7Wp4wRDC7Ipjq9LWbTxRrH5dvXWH7Y9/dI28HAQhAAAIQgAAEIAABCEAAAt4IKBm35a2JPbz72vZIRDCbIphOf1TutxK29fTVZ8/f/+JDBDBvHSnfAwEIQAACEIAABCAAAQhAAAI2CJAk/1iS/KVIosiheVQYIpg9EUxbXEuIXyrzubeeP//sq88RwGx0i7wlBCAAAQhAAAIQgAAEIAABCHgkQJL8PCKYhI7f/elX3yXNRwSzI4Kp3kpFf8kuLr37Kvm/PHaefBMEIAABCEAAAhCAAAQgAAEI2COgHEWlImBGLFdRYUqq3vLbQ06wPP8qXqgqeY9yrLVklvvZ2v549ulNor/sdYm8MQQgAAEIQAACEIAABCAAAQh4JaBT6rRdK7cIQHn5osxiWSKCtWM/bX/U4RNe+wy+CwIQgAAEIAABCEAAAhCAAAQgYJaA8hXFCi1c31Zo2eKPCNaubnTghNmOgBeHAAQgAAEIQAACEIAABCAAAQiMQODt2zcQwr7J4eRB3EMEq1+POmRCOfZG6Cv4RghAAAIQgAAEIAABCEAAAhCAgHkCL5294kIE8iBkpXwDIlhdEYzk9+a7Pj4AAhCAAAQgAAEIQAACEIAABEYjQH6wuuJJitDFdsj2daXk9+9/8SHRX6N1lHwvBCAAAQhAAAIQgAAEIAABCPggoPxgmtyXEmgot7x4QyRYecaKmpRo7KPV8xUQgAAEIAABCEAAAhCAAAQgAIFBCSi3EWJVeSGlFGNEsHJ1R/TXoJ0inw0BCEAAAhCAAAQgAAEIQAACfgmcfXoTIcxoonxEsDIiGLm//PZ3fBkEIAABCEAAAhCAAAQgAAEIDE7g8q0rCGEGhTBEsLwiGCc/Dt4R8vkQgAAEIAABCEAAAhCAAAQgMAYBRb+U2rZHuXnFmoknIlg+rq9/dI3cX2N0dXwlBCAAAQhAAAIQgAAEIAABCEDgwgWEsHyiSg3hDxEsvb5eeOfFcx0SQfuHAAQgAAEIQAACEIAABCAAAQhAYDACCGHpwkoNAUzPQAQ7XldKfK98eIM1bz4XAhCAAAQgAAEIQAACEIAABCAAgTkBhLDj4kotAcySCPa3v/70/OzPPz9/+caT57/+42+ab7tVDrz7Xz9AAKPbgwAEIAABCEAAAhCAAAQgAAEIQICtkTXFrJRn/f76L89fu/nEQ5Gpl8gwvcf1Dx47v3T2i/Pf/elXzUWviS9bH+nZIAABCEAAAhCAAAQgAAEIQAACEDhJgIgwGxFhSxFNwtMkjr3x3uMPxTH9Pbj7k/Pzry5k+VN0l8qU+KZnKMrr4rWnuhG85kx06uP7X3xI5Bf9HAQgAAEIQAACEIAABCAAAQhAAALrBHRqXkqkEvf2KaRJJFv+SciSoDWJWqeusVSfyvsl+6V9QwACEIAABCAAAQhAAAIQgAAEIACBIAJKIG5J/OBd+xTeataLxC/yfgU1by6CAAQgAAEIQAACEIAABCAAAQhAYE7gs68+P1dkTU0hg2chZsXagLbw3r1/j+gvui8IQAACEIAABCAAAQhAAAIQgAAEjhOQuPDcW88jhP0BcSpWnCp9/UtnryB+HW/a3AkBCEAAAhCAAAQgAAEIQAACEIDAkoC2mJEwHxGstKgVWr5OfPz4y0+I/KKrggAEIAABCEAAAhCAAAQgAAEIQKAMgbdv3yAijIiwZjaA+FWmXVMqBCAAAQhAAAIQgAAEIAABCEAAAicIKE8Y2yOJCguN2spxHeIXXREEIAABCEAAAhCAAAQgAAEIQAACTQhoe+TlW1eaRQTlEFYoo38hTzm/2PbYpInzUAhAAAIQgAAEIAABCEAAAhCAAATmBCRQPPPmRcQwtkhmtQFOe6SfgQAEIAABCEAAAhCAAAQgAAEIQKA7AkSF9R9RZSHq7emrzz6MLtRppN0ZOS8EAQhAAAIQgAAEIAABCEAAAhCAAAQmAooKI1cYglis4KZIQh24IDGV1gQBCEAAAhCAAAQgAAEIQAACEIAABMwQkKChqJ5YMYTrxxLQlOz+7NObCF9mWjYvCgEIQAACEIAABCAAAQhAAAIQgMCPCCiqR3mdELbGErb26lviqOxCJ4zSbCAAAQhAAAIQgAAEIAABCEAAAhCAgBsCyu+kE/72xBF+9y2WseXRTZPmQyAAAQhAAAIQgAAEIAABCEAAAhDYIqB8Ydr+htjlW+xa1q+ivlT3tA4IQAACEIAABCAAAQhAAAIQgAAEIDAUAcQw/yKYDkdQri8S3Q/VtPlYCEAAAhCAAAQgAAEIQAACEIAABE4RUE4ocob5EcS03fHyrSvn2v6KxUMAAhCAAAQgAAEIQAACEIAABCAAAQgsCEg0kXjCaZL2BLEpyT3bHWnWEIAABCAAAQhAAAIQgAAEIAABCEAgkIC2zmkLnbbSkTesX0FsEr7e/+JDIr4CbZvLIAABCEAAAhCAAAQgAAEIQAACEIDASQLTVkmiw/oQw6atjkR80WAhAAEIQAACEIAABCAAAQhAAAIQgEAhAoo4IndYfTFMEXlv375xLkGyUNVSLAQgAAEIQAACEIAABCAAAQhAAAIQgMCSwLRd8qWzV8gf9of8opiivSQ2SnTkVEfaHwQgAAEIQAACEIAABCAAAQhAAAIQ6ISAxBol1Jd4Qw6xeFFsEr2Uh40THTsxal4DAhCAAAQgAAEIQAACEIAABCAAAQhsEZCIo617RImti2Ha3ijRENGLtgQBCEAAAhCAAAQgAAEIQAACEIAABJwQUB4riT3a3jfiaZP6Zn27hEGS2Tsxaj4DAhCAAAQgAAEIQAACEIAABCAAAQiEEJAYJFFI4tAL77zoYgultjTqW17/6NpD0Q/BK8QSuAYCEIAABCAAAQhAAAIQgAAEIAABCAxGQNsoJ3FMQpIEpd4Esumd9H760/tyYuNghsrnQgACEIAABCAAAQhAAAIQgAAEIACBkgQkNkl00t8kQulf5daaxKmj/yp/2bzMKZJLzyJRfclapWwIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCIxL4P8D1HZUAmq5z74AAAAASUVORK5CYII=" />\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="label">\n    \t\t\t\t                Atendimento\n    \t\t\t\t            </div>\n    \t\t\t\t        </div>\n\t\t\t\t\n    \t\t\t\t        <div id="boxChamada">\n    \t\t\t\t            <div id="cardSenha" class="card">\n    \t\t\t\t                <div class="header">\n    \t\t\t\t                    Senha\n    \t\t\t\t                </div>\n    \t\t\t\t                <div class="body">\n    \t\t\t\t                    <div id="lblSenha" class="label">\n    \t\t\t\t                        0000000\n    \t\t\t\t                    </div>\n    \t\t\t\t                    <div class="detalhe">\n    \t\t\t\t                        <div id="lblPlaca" class="placa">\n    \t\t\t\t                            000-000\n    \t\t\t\t                        </div>\n    \t\t\t\t                        <div class="bitrem">\n    \t\t\t\t                        \t<span id="lblData">-</span>\n    \t\t\t\t                            <span id="lblVeiculo">-</span>\n    \t\t\t\t                        </div>\n    \t\t\t\t                    </div>\n    \t\t\t\t                </div>\n    \t\t\t\t            </div>\n\t\t\t\t\n\t\t\t\t\n    \t\t\t\t            <div id="cardGuiche" class="card guiche">\n    \t\t\t\t                <div class="header">\n    \t\t\t\t                    Guichê\n    \t\t\t\t                </div>\n    \t\t\t\t                <div class="body">\n    \t\t\t\t                    <div id="lblGuiche" class="label">\n    \t\t\t\t                        00\n    \t\t\t\t                    </div>\n    \t\t\t\t                    <div id="lblGuicheOculto" class="detalhe">Full</div>\n    \t\t\t\t                </div>\n    \t\t\t\t            </div>\n    \t\t\t\t        </div>\n    \t\t\t\t        \n    \t\t\t\t        \n    \t\t\t\t        <div id="rodape">\n    \t\t\t\t        \t<div id=\'quadroInfoRodape\'>\n    \t\t\t\t        \t\t<div>\n\t\t\t\t\t\t\t\t\t    <div id="infoDiaHora">\n\t\t\t\t\t\t\t\t\t        <div class="lblDia">\n\t\t\t\t\t\t\t\t\t            qui, 22 de ago\n\t\t\t\t\t\t\t\t\t        </div>\n\t\t\t\t\t\t\t\t\t        <div class="lblHora">\n\t\t\t\t\t\t\t\t\t            14:56\n\t\t\t\t\t\t\t\t\t        </div>\n\t\t\t\t\t\t\t\t\t    </div>\n\t\t\t\t\t\t\t\t\t    <div id="infoClima">\n\t\t\t\t\t\t\t\t\t        <div class="header">\n\t\t\t\t\t\t\t\t\t            Previsão para hoje - Rio Verde\n\t\t\t\t\t\t\t\t\t        </div>\n\t\t\t\t\t\t\t\t\t        <div class="content">\n\t\t\t\t\t\t\t\t\t            <span id="iconeClima">\n\t\t\t\t\t\t\t\t\t            \t<span id="iconSol" data-sap-ui="__icon115" role="presentation" aria-hidden="true" aria-label="general-leave-request" tabindex="-1" data-sap-ui-icon-content="" class="sapUiIcon fontIcon" style="font-family: SAP-icons; display: none;"></span>\n\t\t\t\t\t\t\t\t\t            \t<span id="iconChuva" data-sap-ui="__icon95" role="presentation" aria-hidden="true" aria-label="weather-proofing" tabindex="-1" data-sap-ui-icon-content="" class="sapUiIcon fontIcon" style="font-family: SAP-icons; display: none;"></span>\n\t\t\t\t\t\t\t\t\t            \t<span id="iconNuvem" data-sap-ui="__icon546" role="presentation" aria-label="cloud" tabindex="-1" data-sap-ui-icon-content="" class="sapUiIcon fontIcon" style="font-family: SAP-icons; display: none;"></span>\n\t\t\t\t\t\t\t\t\t            </span>\n\t\t\t\t\t\t\t\t\t            <div class="d-flex-col flex-center">\n\t\t\t\t\t\t\t\t\t                <div class="label">\n\t\t\t\t\t\t\t\t\t                    <span>MAX</span>\n\t\t\t\t\t\t\t\t\t                </div>\n\t\t\t\t\t\t\t\t\t                <div class="valor">\n\t\t\t\t\t\t\t\t\t                \t<span id="tempMax">--</span>º\n\t\t\t\t\t\t\t\t\t                </div>\n\t\t\t\t\t\t\t\t\t            </div>\n\t\t\t\t\t\t\t\t\t            <div class="d-flex-col flex-center">\n\t\t\t\t\t\t\t\t\t                <div class="label">\n\t\t\t\t\t\t\t\t\t                    <span>MIN</span>\n\t\t\t\t\t\t\t\t\t                </div>\n\t\t\t\t\t\t\t\t\t                <div class="valor">\n\t\t\t\t\t\t\t\t\t                \t<span id="tempMin">--</span>º\n\t\t\t\t\t\t\t\t\t                </div>\n\t\t\t\t\t\t\t\t\t            </div>\n\t\t\t\t\t\t\t\t\t        </div>\n\t\t\t\t\t\t\t\t\t    </div>\n\t\t\t\t\t\t\t\t    </div>\n\t\t\t\t\t\t\t    </div>\n\t\t\t\t\t\t\t    <div id="boxMensagem">\n\t\t\t\t\t\t\t        <span id="boxMessage" class="msg"></span>\n\t\t\t\t\t\t\t    </div>\n\t\t\t\t\t\t\t</div>\n    \t\t\t\t        \n    \t\t\t\t    </div>\n\t\t\t\t\n    \t\t\t\t    <div id="listaChamadas">\n    \t\t\t\t        <div class="header">\n    \t\t\t\t            <div>Senhas</div>\n    \t\t\t\t            <div>Guichês</div>\n    \t\t\t\t        </div>\n    \t\t\t\t        <div class="listagem">\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t            <div class="item">\n    \t\t\t\t                <div class=\'lblSenha\'>0000000</div>\n    \t\t\t\t                <div class=\'lblGuiche\'>00</div>\n    \t\t\t\t            </div>\n    \t\t\t\t        </div>\n    \t\t\t\t    </div>\n    \t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div id="menu">\n\t\t\t\t\t<div class="container">\n\t\t\t\t\t\t<div class="form">\n\t\t\t\t\t\t\t<h1>Bem vindo</h1>\n\t\t\t\t\t\t\t<h2>Painel de Atendimento</h2>\n\t\t\t\t\t\t\t<span id="btnAbrirPainel">Abrir</span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</template>'
	}
});