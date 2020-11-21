chrome.runtime.onMessage.addListener(gotMessage) //aqui eu recebo a msg enviada pelo background onde recebo a url da pagina que estou acessando
console.log(removeCaracteresEspeciais('Bem vindo a - & - morgana'))

function retornarMenus(urlPagina){ //função que retorna os menus adiquiridos no servidor
    let req = new XMLHttpRequest()
    let localHost = 'http://localhost:3001/?url='
    let url= localHost.concat(trataUrl(urlPagina))
    console.log(url)
    req.open('GET', url, true) //envio a url tratada para o servidor
    req.responseType = 'json'   //recebo a resposta do tipo json
    req.send() 
    const resultado = [] 
    req.onload = async function() {   //abro a função onload para pegar a resposta
        let menus = await req.response
        console.log("Mapeamento concluido")
        for(let i = 0; i < menus.length; i++) { 
            resultado.push(menus[i]) //apos percorrer o for eu salvo em um vetor todos os menuns
        }
        apiDeVoz(resultado) //chamo a api de voz e passo o resultado dos menus adquiridos 
    }  
      
}


function natural(palavra1, palavra2){ //função que manda duas palavras ou frases para o servidor checar se as duas correspondem e sao parecidas
    let xhr = new XMLHttpRequest()
    let localHost = 'http://localhost:3001/natural/?palavra1=' 
    let url= localHost.concat(palavra1 + '&palavra2=' + palavra2)
    xhr.open('GET', url, false);
    xhr.send(null)
    return xhr.responseText //aqui eu trabalho de mandeira sincrona, por isso avro direto e não preciso abrir a função onload
}


function lerTexto(){ //função chamada para preparar o texto para ser lido pela função falar
    let menus_color = document.getElementsByTagName('p') //aqui eu pego todos os paragrafos 

    let texto = 'Lendo a pagina em 3,2,1...' //texto lido antes do texto para avisar o usuario que a leitura vai começar
    for (elt of menus_color){ // aaqui vou mudar a cor e a fonte da letra para o usuario saber qual texto está sendo lido na tela
        elt.style['color'] = 'blue' //mudo a cor para azul
        elt.style['font-family'] = 'Oswald, sans-serif' // mudo a fonte
        texto = texto.concat(elt.innerText) //concateno o texto que recebi para virar um texto corrido
    }
    falar(texto) //agora passo o texto para a função que vai ler o texto
}

function destacarLinks(){ //função que muda o css da pagina para o usuario saber onde estão todos os links da pagina e provavelmente seus nomes
    let menus_color = document.getElementsByTagName('a') //pego todos os links dentro da tag <a>

    let texto = 'Links destacados' //texto pre definido que será passado para a função falar e avisar que os links foram destacadados
    for (elt of menus_color){ //configurações de ccs para destacar os links
        elt.style['color'] = '#162399' //cor
        elt.style['background-color'] = '#EBFFD9' //background da cor
        elt.style['font-family'] = 'Oswald, sans-serif' // fonte
        elt.style['border-radius'] = '10px' //borda do fundo
        elt.style['border-color']='#C2D8FF' //cor da borda
        elt.style['border-style']='solid' //stilo da borda
    }
    falar(texto) // passando o texto para ser reproduzido
}

function gotMessage (message, sender, sendResponse){ //pegando a url que recebi do background e dando inicio a todas as funçoes
    click()
    console.log(message.txt) //url recebida
    retornarMenus(message.txt) // passando url para a função retornar os menus  
    falar("Espere para dá comandos")
}

function apiDeVoz(menus){ //aqui na api de voz eu do inicio a web speech
    falar("Pronto!") //agora que os menus foram retornados eu já sei que posso da comandos de voz

    let recognition = new webkitSpeechRecognition() //instacio um novo chamado recognition
    recognition.continuous = true //que que ele é continuo
    recognition.interimResults = false //e que resultados intermediarios não sao permitidos apenas quando o usuario terminar de falar
    recognition.lang = "pt-BR" //determino a lingua que estarei escutando

    recognition.onerror = function(event) { //função que capta os erros que ocorrerem durante a execução
        console.log('Speech recognition error detected: ' + event.error) //exibindo os erros
        console.log('Additional information: ' + event.message)
        console.error(event) 
    }

    recognition.onstart = function () { //função que da inicio a api caso ela pare
        console.log('O serviço de voz foi iniciado')
    }

    recognition.onend = function (event) { //se por algum motivo a api para de funcionar e a onend que faz isso
        console.log('O serviço de voz foi reconectado!')
        console.error(event) //imprimo o motivo de ela ter sido chamada
        recognition.start() //e aqui forço que ela seja reconectada novamente
    }

    recognition.onresult = function (event) { //nessa função adquiro os resultados do que é escutado
        let interim_transcript = ''  //inicio a variavel e determino que não tem palavras
        let final_transcript = '' //inicio a variavel e determino que não tem palavras
        let resultado_audio_tratado //variavel auxiliar

        for (var i = event.resultIndex; i < event.results.length; ++i) { //percorrendo os eventos de fala
            if (event.results[i].isFinal) { //se o usuario parou de falar entra nessa condição
                final_transcript += event.results[i][0].transcript // e aqui o valor final é atribuido a variavel
            } else { // se não fica nessa função 
                interim_transcript += event.results[i][0].transcript // recebendo resultados
            }
        }

        console.log("Final: ", final_transcript) //aqui exibo o resultado final para analise

        let palavras_resultado = final_transcript.split(" ") //aqui eu separo o texto no espaço
        recognition.abort() //já que eu já tenho um resultado eu paro a api de voz que vai ser reiniciada novamente
        resultado_audio_tratado = tratamentoAudio(palavras_resultado, menus) //passo os menus e o resultado para uma função que vai fazer a comparação e retorna um valor

        if (resultado_audio_tratado == 0) { //se o valor retornado e salvo na variavel for 0 quer dizer que foi identificado um comando e eu vou apagar o que já tenho nas strings e vou ficar pronto para um novo comando
            interim_transcript = ''
            final_transcript = ''
        } else{ // se for diferente de 0 quer dizer que um comando não foi identificado
            interim_transcript = ''
            final_transcript = ''
            falar("Comando não identificado!") //aqui aviso o usuario com o comando de voz que não foi identificado
        }
    }
    recognition.start()
}

function tratamentoAudio(audio, menus) { //aqui no tratamento de audio onde recebo os menus e o texto falado pelo usuario no qual faço as comparações
    let cont = 0 // variavel na qual uso como contador de comandos
    let myVar = audio.toString()

    let resultado = myVar.replace(/,/g, " ") //variavel auxiliar que uso para retornar o resultado do texto sem caracteres especiais
    resultado = removeCaracteresEspeciais(resultado) //chamada da função que remove os caracteres especiais
    console.log(resultado)
    
    for (let i = 0; i < audio.length; i++) { //percorro todos as palavras do vetor que juntas forma o texto

        if (cont == 0) { //se o contador ainda é zero é sinal que vou procurar inicialmente pela palavra que desencadeia os outros comandos
            const resultado = natural(audio[i].toLocaleLowerCase(), 'morgana') //procuro a correspondencia do comando inicial
            console.log("resultado natural = " + resultado ) //imprimo apenas para ver a comparação
            if ( resultado >= 0.85) { //comparo para ver se o resultado foi aceitavel
                console.log(" palavra morgana corresponde a = " + audio[i].toLocaleLowerCase()) //imprimo caso seja
                cont = cont + 1 //contador que antes era zwero agora é 1 é posso seguir agora procurando pelo comando 
            }
        }
        if (cont == 1) { //agora que achei o comando morgana, tenho cont = 1 onde vou procurar por um comando
            //primeiro vou procurar pela corresponencia do comando abrir ou acessar, onde os mesmos fazem a mesma coisa
            if (natural(audio[i].toLocaleLowerCase(), 'abre') >= 0.82 || natural(audio[i].toLocaleLowerCase(), 'acessa') >= 0.9 ){
                audio[i] = 'abre' //caso eu encontre um dos dois eu substituo por 'abre' para remover mais tarde
                cont = cont + 1 //cont é incrementado para seguir para o proximo passo
                comando = 1 //aqui eu digo para variavel comando que foi dado o primeiro comando que é abrir, então com essa informação eu continuo 
                console.log('comando  = , ' + comando + 'cont = ' + cont)
            }
            //se o primeiro if não entrou então vamos para a segunda opção, que é o comando voltar
            if (natural(audio[i].toLocaleLowerCase(), 'voltar') >= 0.85) {
                cont = 0 // se o comando voltar é identificado o cont zera porque o comando já se encerrou e agora vou apenas chamar a função desejada
                falar("Voltando...") //informo ao usuario atraves de uma mensagem de voz o comando identificado
                voltarLink() //chamo a função que volta para a pagina anterior
                comando = 2 //digo que encotrei o segundo comando aqui atribuindo 2 para não entrar em mais nem um if
                console.log('comando  =  ' + comando + ', cont = ' + cont)
            }
            //se nem um dos anteriores não entrou então posso procurar pelo comando pesquisar
            if (natural(audio[i].toLocaleLowerCase(), 'pesquisar') >= 0.85) {
                cont = 0 // se o comando pesquisar é identificado o cont zera porque o comando já se encerrou e agora vou apenas chamar a função desejada
                tempAudio = resultado.toLocaleLowerCase() //aqui eu trato todos os caracteres para garantir que eles vão está em caixa baixa
                tempAudio = tempAudio.replace('morgana', '') //então eu removo da frase o comando morgana e pesquisar para deixar apenas o que eu desejo pesquisar e passar por parametro o mesmo
                tempAudio = tempAudio.replace('pesquisar', '') //...
                pesquisar(tempAudio) //chamo a função e passo o parametro apenas com o que eu quero pesquisar
                comando = 2 //novamente atribuo 2 para não entrar em nem um if
                console.log('comando  =  ' + comando + ', cont = ' + cont) 
            }
            //continuando, se nem um comando antes foi identificado eu procuro por destacar  links
            if (natural(audio[i].toLocaleLowerCase(), 'exibir links') >= 0.85 || natural(audio[i].toLocaleLowerCase(), 'mostrar menus') >= 0.85 || natural(audio[i].toLocaleLowerCase(), 'destacar links') >= 0.85) { //eu chamo a função natural que vai checar se o comando destacar links está presente no texto
                cont = 0 //zero pois o comando vai ser reiniciado novamente agora que achei
                comando = 2 //novamente atribuo 2 para não entrar em nem um if
                destacarLinks() //chamo a função desejada
            }
            //aqui eu aceito dois comandos onde procuro pela semelhança com um ou outro, os dois tem a opção de rolar a pagina
            if (natural(audio[i].toLocaleLowerCase(), 'rolar') >= 0.87 || (natural(audio[i].toLocaleLowerCase(), 'ir') >= 0.87) ){
                cont = cont + 1 //aqui atribuo valor ao contador, pois caso eu encontre agora quero que o contador tenha valor 2 para continuar 
                comando = 3 //o comando 1 diz que é para eu entrar na procura de menus, o 3 agora vai dizer pra eu entrar na procura do proximo comando, se é para ir para baixo ou para cima
                console.log('comando  =  ' + comando + ', cont = ' + cont)
            }
            //caso o comando dado seja ler a pagina ele entrara aqui
            if (natural(audio[i].toLocaleLowerCase(), 'ler') >= 0.85) {
                cont = 0 //novamente é zerado pois o comando vai acabar
                lerTexto() //chamo a função para ler a pagina
                comando = 2 //mostro que não vou querer entrar em mais nem um if
                console.log('comando  =  ' + comando + ', cont = ' + cont)
            }
            //aqui o comando cancelar faz ser interrompido a leitura da pagina caso o usuario queiria
            if (natural(audio[i].toLocaleLowerCase(), 'cancelar') >= 0.85) {
                cont = 0 //novamente é zerado pois o comando vai acabar
                pararDeFalar() //chamo a função que vai interromper a fala
                comando = 2 //mostro que não vou querer entrar em mais nem um if
                console.log('comando  =  ' + comando + ', cont = ' + cont)
            }
        }
        //caso o cont seja 2 e o comando 1 sei que quero abrir um menu então isso que vou fazer
        if (cont == 2 && comando == 1) {
            let tempAudio = resultado.toLocaleLowerCase() //deixo todo o resultado em letras minusculas e salvo em uma variavel de auxilio
            tempAudio = tempAudio.replace('morgana', '').replace('abre', '') //removo a palavra morgana e o comando de abrir para deixar apenas o menu a ser pesquisado
            tempAudio = removeCaracteresEspeciais(tempAudio).trim() //removo os caracters em branco desnecessarios e todos os caracteres especiais
            
            console.log(tempAudio)
            //variaveis de auxilio no tratamento dos comandos e menus
            let fraseRetorno
            let menusSemEspaco

            for (let x = 0; x < menus.length; x++) { //percorro todos os menus para as comparações
                let tempMenus = menus[x].texto.toLocaleLowerCase() //coloco todos os menus em minusculo  
                menusSemEspaco = tempMenus.trim() //removo todos os espeços em branco desnecessarios
                menusSemEspaco = removeCaracteresEspeciais(menusSemEspaco) //removo todos os caracteres especiais
                console.log(tempAudio + ' -> '+ menusSemEspaco) 
                let str = "Comando recebido, Abrindo menu " //aqui eu atribui o começo da frase que vou falar para o usuario caso encontre o menu
                if (natural(tempAudio, menusSemEspaco) >= 0.84) //faço a comparação para ver se encontro correspondencia
                console.log(tempAudio, " = ",menusSemEspaco) //imprimo caso encontre

                if (natural(tempAudio, menusSemEspaco) >= 0.87) { //repito o passo com menos tolerancia
                    if (menusSemEspaco.length > 4){ //se o comando for mais que 4 caracteres aceito, para evitar abrir links de idiomas tipo pt etc
                    cont = 0 //digo que o comando pode ser encerrado pois já cheguei ao fim                              
                    fraseRetorno = str.concat(menus[x].texto.toLocaleLowerCase()) //concateno minha frase pre determinada com o menu que encontrei
                    falar(fraseRetorno)//digo ao usuario que vou abrir o menu desejado
                    
                    abreLink(menus[x].link) //chamo a função que vai abrir o menu
                    x = menus.length //forço sair do for pois até a função ser concretizada o for continua por um tempo ainda
                    }
                    else{
                        console.log('Menu não encontrado') //caso percorra todos os menus imprimo no console que não encontrei
                        //mas tambem falo pro usuario quando o retorno da função não retornar o valor desejado, usando a função falar
                    }
                    
                }
            }

        }
        if (cont == 2 && comando == 3) { //caso o cont seja igual a 2 e o comando 3 sei que agora vou procurar ou por "cima" ou "baixo" que é o complemento do rolar
            if (natural(audio[i].toLocaleLowerCase(), 'baixo') >= 0.87) { //procuro a correspondecia
                comando = 0 //zero o comando se encontrar
                cont = 0 //zero o cont
                scrollDown() //chamo a função 
            }
            //se não procuro pelo outro comando possivel
            else if (natural(audio[i].toLocaleLowerCase(), 'cima') >= 0.87) {//procuro a correspondecia
                comando = 0 //zero o comando se encontrar
                cont = 0//zero o cont
                scrollUp()//chamo a função 
            }
            //por ultimo se não encontro nada não faço nada
            else{
            }
        }

    }
    return cont //de acordo com o valor retornado eu sei se achei um comando ou não
}



function voltarLink() { //função que volta no historico 
    var referencia = history.back()
    falar(referencia)
    falar('pronto')
}
function scrollUp(){ //função que rola a pagina para cima
    console.log ("Rolar para cima acionado")
    falar("Rolando a pagina para cima") //aviso o usuario do comando
    window.scrollBy(0, -400) //digo que vou rolar 400 pixels para cima
}
function scrollDown(){ //função que rola a pagina para baixo
    console.log ("Rolar para baixo acionado")
    falar("Rolando para baixo") //aviso o usuario do comando

    window.scrollBy(0, 400)//digo que vou rolar 400 pixels para baixo
}

//função de fala que nos tras o speechSyntesis, api de fala.
function falar(msg){ //recebo o por parametro a frase que vou falar
    let u = new SpeechSynthesisUtterance() //instacio um novo objeto
    u.text = msg //digo a ele o texto
    u.lang = 'pt-br' //o idioma
    u.rate = 1 //a velocidade que vai falar
    speechSynthesis.speak(u) //e por fim chamo a funçao para falar
}

function pararDeFalar(){ //cancelar a fala
    let menus_color = document.getElementsByTagName('p') //aqui é questao estetica, toda vez que o texto vai ser falado eu pinto ele de azul pra facilitar pro usuario
    for (elt of menus_color){ //então eu pego o texto e percorro ele pintando ele de preto de novo
        elt.style['color'] = 'black'
    }
    let u = window.speechSynthesis; //eu instancio um objeto para cancelar
    u.cancel() //chamo a função

    console.log('cancelado')
    falar('Leitura Cancelada.') //informo ao usuario que foi cancelada a leitura
}

function trataUrl(url){ //função que faz o tratamento da url caso ela seja http
    let urlTratada //variavel auxiliar
    if (url.indexOf('https') === -1 ) { //se dentro da url eu não encontro https é pq ela é http
        urlTratada = url.replace('http', "https")//então substituo o http por https, e uso tmb para retirar o # que fica caso eu esteja voltando uma pagina
        console.log(url + ' -> ' + urlTratada) // apenas imprimo no console pra ter uma ciencia que foi mudado
    }
    if (url.indexOf('/#') ) {
        urlTratada = url.replace('/#', "/")
    }
    else{ //se a url já é http não mudo e a retorno
        return url
    }
    return urlTratada //retornando a url tratada
}

function removeCaracteresEspeciais(str) {
	 str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
		.replace(/([^\w]+|\s+)/g, ' ') // substitui espaço e outros caracteres por espaço
		.replace(/\-\-+/g, ' ')	// Substitui multiplos hífens por um único espaço
        .replace(/(^-+|-+$)/, '') // Remove hífens extras do final ou do inicio da string
        
        return str
}

function mudarCor(){ //chamo a função para mudar a cor do texto da pagina que vou ler
    let listaTagsLi = document.getElementsByTagName("p") //adquiro os textos dentro da tag <p> da pagina
    for (let i = 0; i < length.listaTagsLi ; i++){
        listaTagsLi[i].style.color = "blue" //mudo a cor
    }
}

function pesquisar(pesquisa) { //recebo o parametro de pesquisa
    let padrao = 'https://google.com/search?q='
    falar("Exibindo resultados de" + pesquisa) //concateno a frase que vou falar para o usuario com o que ele deseja pesquisar
    window.location.href = (padrao + pesquisa) //abro na mesma pagina a pequisa
}
function abreLink(link) { //função que recebe um link e abre o mesmo
    localStorage.clear()
    window.location.href = link //aqui abro o link na mesma guia
}


function click(x = 0, y = 0)
{
    var ev = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true,
        'screenX': x,
        'screenY': y
    });

    var el = document.elementFromPoint(x, y);

    el.dispatchEvent(ev);
    console.log("clicado com sucesso")
}