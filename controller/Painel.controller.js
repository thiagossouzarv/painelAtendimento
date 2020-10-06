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
			
			var area = this.getView().getModel('area').getData().id_area;
			var n = this;
			var t = e;
			var i = t.chamada;
			var r = t.listaChamada;
			var s = t.boxMensagem;
			var o = this.renovarItens.bind(this);
			var u = t.dateUtils;
			var l = function () {
				var a = "/sap/opu/odata/sap/ZAPP_SENHAS_SRV/senhas?$filter=Area eq '" + area + "'";
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
			var area = this.getView().getModel('area').getData().id_area;
			var a = this;
			var n = e;
			var t = n.boxMensagem;
			var i = this.updateBoxMensagem.bind(this);
			var r = this.renovarItens.bind(this);
			var s = function (e, o) {
				var u = "/sap/opu/odata/sap/ZAPP_SENHAS_SRV/Mensagem?$filter=Area eq '" + area + "'";
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
					return a.valor == v.valor && a.guiche == v.guiche && a.dataString == v.dataString && a.isAguardando == v.isAguardando && a.veiculo ==
						v.veiculo && a.placa == v.placa
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