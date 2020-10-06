sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	var duasCasas = function(num) { return num.toString().length == 1 ? "0" + num : num; };
	var comigoControlData = {};

	return Controller.extend("comigo.com.br.PainelDeSenhas.controller.Painel", {
		onInit: function () {
			$("#listaChamadas .listagem .item").css("height", "calc((100% - 2em)/ 12)");
			comigoControlData = {
				dateUtils: {
					isPast: function(data) { return data < new Date().setHours(0, 0, 0, 0); },
					dateToString: function(data) { return duasCasas(data.getDate()) + "/" + duasCasas(data.getMonth() * 1 + 1) + "/" + data.getFullYear(); }
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
					isNullOrEmpty: function(item) { return (item == null || item.length == 0); }
				},
				diasSemana: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sabado"],
				meses: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
				updateSenhasTiming: 5000,
				server: {
					senhas: [],
					primeiraRodagem: true
				},
				chamada: {
					ultimaSenhaChamada: null,
					audioSenha: document.getElementById("audioSenha"),
					senhas: [], //as senhas mais novas sempre devem ser as adicionadas no final do array
					fila: [], //idem
					numSenhasNovas: 0,
					replaceSenhas: function (novas) {
						this.senhas.length = 0;
						this.senhas.push.apply(this.senhas, novas);
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
					lastUpdate: new Date().getTime(),
					bloqueada: false,
					timing: 10000,
					allItens: $("#listaChamadas").find(".item"),
					itens: Array.from($("#listaChamadas").find(".item")).map(function(item) { return $(item); }),
					senhas: [],
					numSenhasNovas: 0,
					numSenhasRemovidas: 0,
					currentPage: 0
				},
				relogio: {
					timing: 5000,
					dia: $("#infoDiaHora .lblDia"),
					hora: $("#infoDiaHora .lblHora")
				},
				boxMensagem: {
					timing: 5000,
					mensagens: [],
					numMensagensNovas: 0,
					numMensagensRemovidas: 0,
					currentMsg: 0,
					mensagem: $("#boxMessage"),
					loop: null
				},
				painelPrevisao: {
					timing: 1 * 60 * 60 * 1000,
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
		
			var _this = this;
			
			$("#infoClima").hide();
		
			$("#btnAbrirPainel").on("click", function() { return _this.abrirPainel(); });
		},

		abrirPainel: function () {
			$("#menu").fadeOut(1400);
			comigoControlData.listaChamada.allItens.hide();
			this.initPainel();
		},

		initPainel: function () {
			var $quadroHorario = $("#infoDiaHora");
			var $quadroTempo = $("#infoClima");
			var _this = this;
			var animar = this.animarQuadroInfo.bind(this);
			
			this.updateSenhas();
			this.loopChamada();
			//this.loopListaChamadas();
			this.initRelogio();
			this.updateMensagens();
			this.loopMensagens();
			this.initPainelPrevisao();
			
			setInterval(function() {
				
				var $toShow = $quadroHorario.is(":visible") ? $quadroTempo : $quadroHorario;
				var $toHide = $quadroHorario.is(":visible") ? $quadroHorario : $quadroTempo;
				
				animar($toHide);
				
				$toHide.fadeOut(300, function() {
					$toShow.fadeIn(300);
				});
			}, 20000);
		},
		
		animarQuadroInfo: function (item) {
			var _this = this;
			return new Promise(function(resolve, reject) {
				item.parent().animate({
					opacity: 100
				}, {
					duration: 2000,
					step: function (now, fx) {
						$(this).addClass("spin");
					},
					complete: function () {
						$(this).removeClass("spin");
					},	
					progress: function (animation, progress, msRemaining) {
						//var nivel = 100 * progress;
					}
				});

				resolve();
			});
		},

		updateSenhas: function (tipoCard) {
			var _this = this;
			var dados = comigoControlData;
			var chamada = dados.chamada;
			var listaChamada = dados.listaChamada;
			var boxMsg = dados.boxMensagem;
			var renovarItens = this.renovarItens.bind(this);
			var dateUtils = dados.dateUtils;
			var update = function () {
				var url = "/sap/opu/odata/sap/ZAPP_SENHAS_SRV/senhas";
				var senhas = [];

				jQuery.ajax({
						url: url,
						timeout: 10000,
						dataType: "json",
						success: function (data, textStatus, jqXHR) {
							var senhasServer = Array.from(data.d.results);
							//console.log("########", senhasServer);
							var primeiraRodagem = dados.server.primeiraRodagem;
							var totalSenhas = senhasServer.length;
							for (var i = 0; i < totalSenhas; i++) {
								var item = senhasServer[i];
								var dataOrigem = item.DataCriacao;
								var data = new Date(dataOrigem);

								var src = "data:audio/mp3;base64," + item.Audio;
								var contador = (item.QuantidadeChamadas || 1) * 1;

								senhas.push({
									valor: item.Senha,
									guiche: item.Guiche,
									placa: item.Placa,
									veiculo: item.TipoCaminhao,
									data: data,
									dataString: dateUtils.dateToString(data),
									isAguardando: item.Status == "H",
									contador: contador,
									totalShow: primeiraRodagem ? contador - 1 : 0,
									isChamar: function () {
										return this.contador > this.totalShow;
									},
									audio: item.Audio.length > 0 ? src : null
								});
							}

							dados.server.senhas = senhas;
							dados.server.primeiraRodagem = false;
							//console.log("Senhas alteradas");
						},
						error: function (e) {
							console.log("Erro na requisição das senhas");
						}
					})
					.always(function () {
						setTimeout(update.bind(_this), dados.updateSenhasTiming);
					});
			};

			update();
		},

		updateMensagens: function () {
			var _this = this;
			var dados = comigoControlData;
			var boxMsg = dados.boxMensagem;
			var callback = this.updateBoxMensagem.bind(this);
			var renovarItens = this.renovarItens.bind(this);
			var update = function (resolve, reject) {
				var url = "/sap/opu/odata/sap/ZAPP_SENHAS_SRV/Mensagem";
				jQuery.ajax({
						url: url,
						timeout: 10000,
						dataType: "json",
						success: function (data, textStatus, jqXHR) {
							var resp = data.d.results;
							var mensagens = resp.length > 0 ? Array.from(resp).map(function(item) { return item.Texto; }) : [];
							var dataMsg = renovarItens(boxMsg.mensagens, mensagens, dados.tiposDados.mensagem);

							boxMsg.mensagens = dataMsg.itens;
							boxMsg.numMensagensNovas = dataMsg.numItensNovos;
							boxMsg.numMensagensRemovidas = dataMsg.numItensRemovidos;
							//console.log("Mensagens alteradas");
						},
						error: function (e) {
							console.log("Erro na requisição das mensagens");
						}
					})
					.always(function() {
						if (boxMsg.numMensagensNovas > 0 || boxMsg.numMensagensRemovidas > 0) {
							_this.stopLoopMensagens();
							callback();
							setTimeout(_this.loopMensagens.bind(_this), 1000);
						}
						setTimeout(update.bind(_this), boxMsg.timing);
					});
			};

			update();
		},
		
		loopMensagens: function () {
			var _this = this;
			var callback = this.updateBoxMensagem.bind(this);
			comigoControlData.boxMensagem.loop = setInterval(callback, 60000);
		},
		
		stopLoopMensagens: function () {
			clearInterval(comigoControlData.boxMensagem.loop);
		},

		renovarItens: function (originais, novos, tipoDados, isChamada) {
			isChamada = isChamada != null ? isChamada : false;
			originais = Array.from(originais);
			novos = Array.from(novos);
			var TIPOS = comigoControlData.tiposDados;
			tipoDados = tipoDados || TIPOS.senha;

			var _this = this;
			var chamada = comigoControlData.chamada;
			var numItensRemovidos = 0;
			var numItensNovos = 0;
			var itens = [];
			var fila = [];
			var ordenarSenhas = function(itens) { return itens.sort(function(last, next) {
				if (last.isAguardando && next.isAguardando) return last.guiche * 1 > next.guiche * 1 ? 1 : -1;
				else if (last.isAguardando || next.isAguardando) return (next.isAguardando) ? 1 : -1;
				else return last.guiche * 1 > next.guiche * 1 ? 1 : -1;
			});};

			if (isChamada) {
				var itens = Array.from(chamada.fila);
				var itensFinal = [];

				itens.forEach(function(item) {
					var hasItem = _this.hasSenha(novos, item);
					if (hasItem)
						itensFinal.push(item);
				});

				fila = itensFinal;
			}

			while (originais.length > 0) {
				var item = originais.shift();
				var idxItem = tipoDados == TIPOS.senha ? novos.findIndex(function(senha) {
					return (
						senha.valor == item.valor &&
						senha.guiche == item.guiche &&
						senha.dataString == item.dataString &&
						senha.isAguardando == item.isAguardando &&
						senha.veiculo == item.veiculo &&
						senha.placa == item.placa
					);
				}) : novos.indexOf(item);
				var existe = idxItem != -1;

				if (existe) {
					var novoItem = novos.splice(idxItem, 1)[0];
					if (tipoDados == TIPOS.senha) {
						novoItem.totalShow = item.totalShow * 1;
						if ((isChamada && novoItem.isAguardando) || (!isChamada && novoItem.totalShow > 0)) {
							itens.push(novoItem);
							if (isChamada && novoItem.isChamar() && !_this.hasSenha(Array.from(chamada.fila), novoItem))
								fila.push(novoItem);
						} else
							numItensRemovidos += 1;
					} else
						itens.push(novoItem);
				} else
					numItensRemovidos += 1;
			}

			numItensNovos = novos.length;

			if (numItensNovos > 0) {
				if (tipoDados == TIPOS.senha && !isChamada) {
					numItensNovos = 0;
					itens = ordenarSenhas(itens);
					novos = [];
				}
				itens = isChamada ? itens.concat(novos) : novos.concat(itens);
				if (isChamada) fila = fila.concat(novos);
			}

			return {
				numItensNovos: numItensNovos,
				numItensRemovidos: numItensRemovidos,
				itens: itens,
				fila: fila
			};
		},

		hasSenha: function (array, senha) {
			return array.findIndex(function(s) { return s.valor == senha.valor && s.guiche == senha.guiche && s.placa ==
				senha.placa && s.dataString == senha.dataString; }) != -1;
		},

		getSenhaIfExist: function (array, senha) {
			return array.find(function(s) { return s.valor == senha.valor && s.guiche == senha.guiche && s.placa == senha.placa && s.dataString ==
				senha.dataString; });
		},

		updateSenhasChamada: function () {
			var _this = this;
			return new Promise(function(resolve) {
				var dados = comigoControlData;
				var senhas = dados.server.senhas;
				var senhasAguardando = senhas.filter(function(senha) { return senha.isAguardando; });
				var renovarItens = _this.renovarItens.bind(_this);
				var chamada = dados.chamada;
				var dataChamada = renovarItens(Array.from(chamada.senhas), senhasAguardando, null, true);
				chamada.senhas = dataChamada.itens;
				chamada.fila = dataChamada.fila;
				resolve();
			});
		},

		loopChamada: function () {
			var _this = this;
			var dados = comigoControlData;
			var chamada = dados.chamada;
			var chamarItem = this.chamarItem.bind(this);
			var clearChamada = this.clearChamada.bind(this);
			var updateSenhasChamada = this.updateSenhasChamada.bind(this);
			var renderLista = this.forceRenderLista.bind(this);
			var updateItensLista = this.updateItensLista.bind(this);
			var func = function() {
				var callback = function() { return setTimeout(func.bind(_this), 1000); };

				updateSenhasChamada().then(function() {
					try {
						updateItensLista().then(function(resp) {
							var promise; ////////////////////////////////////////////////////akiiiiiiiiiiiiiiiiiiiiiiiiiiiii
							var lastUpdate = (new Date().getTime() - dados.listaChamada.lastUpdate);

							if (dados.listaChamada.numSenhasRemovidas > 0 || dados.listaChamada.numSenhasNovas > 0)
								promise = renderLista();
							else {
								if ((lastUpdate > dados.listaChamada.timing) && chamada.fila.length == 0) {
									dados.listaChamada.lastUpdate = new Date().getTime();
									_this.renderListaChamadas();
								}
								promise = new Promise(function(resolver) { return resolver(); });
							}

							promise.then(function(resp) {
								if (chamada.fila.length == 0) {
									var fonte = Array.from(dados.server.senhas);
									var ultimaSenha = fonte.length > 0 && chamada.ultimaSenhaChamada != null ? _this.getSenhaIfExist(fonte, chamada.ultimaSenhaChamada) : null;
									var senhaChamadaDepreciada = !ultimaSenha || !ultimaSenha.isAguardando;
									
									if (chamada.senhas.length == 0 || senhaChamadaDepreciada) clearChamada();
									callback();
									return;
								}

								var item = chamada.fila.shift();
								var senha = _this.getSenhaIfExist(chamada.senhas, item);
								chamarItem(item).then(function(resp) {
									senha.totalShow += 1;
									if (!_this.hasSenha(Array.from(dados.listaChamada.senhas), item)) {
										dados.listaChamada.senhas.unshift(item);
										dados.listaChamada.numSenhasNovas = 1;
										renderLista().finally(function(resp) { return callback(); });
									} else
										callback();
								});
							});
						});
					} catch (err) {
						console.log("Erro loop chamada");
						callback();
					}
				});
			};

			func();
		},

		updateItensLista: function () {
			var dados = comigoControlData;
			var listaChamada = dados.listaChamada;
			var server = dados.server;
			var _this = this;
			var emAtendimento = server.senhas.filter(function(obj) { return !obj.isAguardando; });
			var ordenarSenhas = function(itens) { return itens.sort(function(last, next) {
				if (last.isAguardando && next.isAguardando) return last.guiche * 1 > next.guiche * 1 ? 1 : -1;
				else if (last.isAguardando || next.isAguardando) return (next.isAguardando) ? 1 : -1;
				else return last.guiche * 1 > next.guiche * 1 ? 1 : -1;
			});};

			return new Promise(function(resolve) {
				var itens = [];
				var removidos = 0;
				var adicionados = 0;

				listaChamada.senhas.forEach(function(item) {
					var obj = _this.getSenhaIfExist(Array.from(server.senhas), item);
					if (obj) {
						if (obj.isAguardando != item.isAguardando) adicionados++;
						itens.push(obj);
					}
					else
						removidos++;
				});
				
				emAtendimento.forEach(function(item) {
					if (!_this.hasSenha(Array.from(listaChamada.senhas), item)){
						itens.push(item);
						adicionados++;
					}
				});

				listaChamada.senhas = ordenarSenhas(itens);
				listaChamada.numSenhasRemovidas = removidos;
				listaChamada.numSenhasNovas = adicionados;
				//resolve();
				setTimeout(function() { return resolve(); }, 50);
			});
		},

		animarChamada: function () {
			var sleep = this.sleep.bind(this);
			var time = 200;
			var animar = this.zoomItem.bind(this);

			return new Promise(function(resolve) {

				animar($("#cardSenha"))
					.then(sleep(time))
					.then(function(resp) { return animar($("#cardGuiche")); })
					.then(function(resp) { return resolve(); });
			});
		},

		zoomItem: function (item) {
			return new Promise(function(resolve, reject) {

				item.animate({
					opacity: 100,
				}, {
					duration: 1300,
					step: function (now, fx) {
						$(this).addClass("animate");
					},
					complete: function () {
						$(this).removeClass("animate");
					},
					progress: function (animation, progress, msRemaining) {}
				});

				resolve();
			});
		},

		chamarItem: function (senha) {
			var _this = this;
			var dados = comigoControlData;
			var chamada = dados.chamada;
			var tocarAudio = this.tocarAudio.bind(this);
			var animar = this.animarChamada.bind(this);

			return new Promise(function(resolve, reject) {
				var validacao = dados.validacao;
				var animarChamada = _this.animarChamada.bind(_this);
				var dateUtils = dados.dateUtils;

				var play = function () {
					chamada.campainha.play();
					removeEventListener("click", play);
				};

				animar();
				tocarAudio(chamada.campainha)
					.then(function (resp) {
						if (senha.audio) {
							var audioSenha = chamada.audioSenha;
							audioSenha.src = senha.audio;
							tocarAudio(audioSenha, 5000).then(resolve);
						} else
							resolve();
					});

				chamada.lblSenha.html(senha.valor).css("color", "#064c4d");
				chamada.lblGuiche.html(senha.guiche).css("color", "#064c4d");
				chamada.lblData.html(senha.dataString);
				chamada.lblVeiculo.html(senha.veiculo);
				chamada.lblPlaca.html(senha.placa);
				chamada.lblOculto.html("ALL");

				chamada.numSenhasNovas = 0;
				chamada.numSenhasRemovidas = 0;

				chamada.lblData.hide();
				chamada.lblVeiculo.hide();

				if (dateUtils.isPast(senha.data)) chamada.lblData.show();
				else chamada.lblVeiculo.show();
				
				chamada.ultimaSenhaChamada = senha;
			});
		},

		tocarAudio: function (elemento, max) {
			max = max != null ? max : 3000;
			return new Promise(function(resolve, reject) {
				var func = function() {
					elemento.removeEventListener("ended", func);
					resolve();
				};

				elemento.addEventListener("ended", func);
				var promise = elemento.play();
				promise.catch(function(resp) { return resolve(); });
				setTimeout(resolve, max);
			});
		},

		clearChamada: function () {
			var dados = comigoControlData;
			var chamada = dados.chamada;

			chamada.lblSenha.html("0000000").css("color", "white");
			chamada.lblGuiche.html("00").css("color", "white");
			chamada.lblData.html("");
			chamada.lblVeiculo.html("");
			chamada.lblPlaca.html("");
			chamada.lblOculto.html("");
		},

		animarLista: function () {
			var _this = this;
			return new Promise(function(resolve) {
				var dados = comigoControlData;
				var lista = dados.listaChamada;
				var itens = lista.itens;
				var sleep = _this.sleep.bind(_this);
				var animar = _this.animarItemLista.bind(_this);
				var time = 100;

				animar(itens[0])
					.then(sleep(time))
					.then(function(resp) { return animar(itens[1]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[2]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[3]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[4]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[5]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[6]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[7]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[8]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[9]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[10]); })
					.then(sleep(time))
					.then(function(resp) { return animar(itens[11]); })
					.then(sleep(time))
					.then(function(resp) { return resolve(); });
			});
		},

		sleep: function (ms) {
			return function (x) {
				return new Promise(function(resolve) { return setTimeout(function() { return resolve(x); }, ms); });
			};
		},

		animarItemLista: function (item) {
			return new Promise(function(resolve, reject) {
				item.animate({
					opacity: 100,
				}, {
					duration: 500,
					step: function (now, fx) {
						$(this).addClass("spin");
					},
					complete: function () {
						$(this).removeClass("spin");
					},
					progress: function (animation, progress, msRemaining) {
						var nivel = 100 * progress;

						$(this).removeClass("step1 step2 step3 step4");

						if (nivel < 20)
							$(this).addClass("step1");
						else if (nivel < 40)
							$(this).addClass("step2");
						else if (nivel < 60)
							$(this).addClass("step3");
						else if (nivel < 80)
							$(this).addClass("step4");
					}
				});

				resolve();
			});
		},

		forceRenderLista: function () {
			var dados = comigoControlData;
			var listaChamada = dados.listaChamada;
			var renderLista = this.renderListaChamadas.bind(this);

			dados.listaChamada.lastUpdate = new Date().getTime();

			return new Promise(function(resolve) {
				renderLista();
				resolve();
			});
		},

		renderListaChamadas: function () {
			var _this = this;
			var dados = comigoControlData;
			var listaChamada = dados.listaChamada;
			var animarLista = this.animarLista.bind(this);
			var senhas = Array.from(listaChamada.senhas);
			var totalPerPage = 12;

			/*if (listaChamada.bloqueada)
				return false;*/

			listaChamada.bloqueada = true;

			if (senhas.length == 0) {
				listaChamada.allItens.hide();
				listaChamada.bloqueada = false;
				return true;
			}

			if (Math.ceil(senhas.length / totalPerPage) > 1 || listaChamada.numSenhasNovas > 0 || listaChamada.numSenhasRemovidas > 0) {
				var totalSenhas = senhas.length;
				var maxPages = Math.ceil(totalSenhas / totalPerPage);
				var currentPage = listaChamada.currentPage > maxPages ? maxPages : listaChamada.currentPage;
				var nextPage = listaChamada.numSenhasNovas > 0 ? 0 : (currentPage + 1 > maxPages - 1 ? 0 : currentPage + 1);
				var itens = listaChamada.itens;
				var nextIdx = nextPage * totalPerPage;
				var novasSenhas = senhas.slice(nextIdx, nextIdx + totalPerPage);

				listaChamada.allItens.hide();
				listaChamada.allItens.removeClass("aguardando");
				itens.forEach(function(item, idx) {
					var senha = novasSenhas.length - 1 < idx ? null : novasSenhas[idx];

					if (senha != null) {
						if (senha.isAguardando) item.addClass("aguardando");
						item.show();
						item.find(".lblSenha").html(senha.valor);
						item.find(".lblGuiche").html(senha.guiche);
					}
				});

				listaChamada.currentPage = nextPage;
				listaChamada.numSenhasNovas = 0;
				listaChamada.numSenhasRemovidas = 0;

				animarLista().finally(function() { listaChamada.bloqueada = false; });
				return true;
			}
		},

		initRelogio: function () {
			var dados = comigoControlData;
			var relogio = dados.relogio;
			var duasCasas = function(num) { return num.toString().length == 1 ? "0" + num : num; };
			var update = function() {
				var hoje = new Date();
				var diaSemana = dados.diasSemana[hoje.getDay()];
				var dia = hoje.getDate();
				var mes = dados.meses[hoje.getMonth()];
				var hora = hoje.getHours();
				var minutos = hoje.getMinutes();

				relogio.dia.html(diaSemana + ", " + duasCasas(dia) + " de " + mes);
				relogio.hora.html(duasCasas(hora) + ":" + duasCasas(minutos));
			};

			update();
			setInterval(update, relogio.timing);
		},

		updateBoxMensagem: function () {
			var dados = comigoControlData;
			var boxMsg = dados.boxMensagem;
			var mensagens = boxMsg.mensagens;

			if (mensagens.length == 0) {
				boxMsg.mensagem.fadeOut();
				return;
			}

			if (mensagens.length > 1 || boxMsg.numMensagensNovas > 0 || boxMsg.numMensagensRemovidas > 0) {
				boxMsg.mensagem.fadeOut("slow", function() {
					var currentIdx = boxMsg.currentMsg;
					var lastIdx = mensagens.length - 1;
					var nextIdx = currentIdx + 1 > lastIdx ? 0 : currentIdx + 1;
					var numMsgNovas = boxMsg.numMensagensNovas;

					nextIdx = numMsgNovas > 0 ? 0 : nextIdx;

					var msg = mensagens[nextIdx];

					boxMsg.mensagem.html(msg);
					boxMsg.mensagem.fadeIn();

					boxMsg.currentMsg = nextIdx;
					boxMsg.numMensagensNovas = 0;
					boxMsg.numMensagensRemovidas = 0;
				});
			}
		},

		initPainelPrevisao: function () {
			var _this = this;
			var dados = comigoControlData;
			var previsao = dados.painelPrevisao;
			var random = function(min, max) { return (Math.floor(Math.random() * (max - min + 1)) + min); };
			var func = function() {
				var clima = {
					precipitacao: 0,
					temperatura: {
						max: 0,
						min: 0
					}
				};

				var url = "/sap/opu/odata/sap/ZAPP_SENHAS_SRV/PrevisaoTempo('0002')";

				jQuery.ajax({
						url: url,
						timeout: 60000,
						dataType: "json",
						success: function (data, textStatus, jqXHR) {
							var item = data.d;
							//console.log(item);

							if (item != null && item.Suportado == "X") {
								clima.precipitacao = item.Precipitacao;
								clima.temperatura.max = item.Maximo.replace(/\D+/g, "");
								clima.temperatura.min = item.Minimo.replace(/\D+/g, "");
							}

							previsao.allIcons.hide();

							if (clima.precipitacao > 10)
								previsao.icones.chuva.show();
							else if (clima.temperatura.max > 25)
								previsao.icones.sol.show();
							else
								previsao.icones.nuvem.show();

							previsao.max.html(clima.temperatura.max);
							previsao.min.html(clima.temperatura.min);
							//console.log("Previsão alterada");
						},
						error: function (e) {
							console.log("Erro na requisição da previsão");
						}
					})
					.always(function() { return setTimeout(func.bind(_this), previsao.timing); });
			};
			func();
		}

	});
});