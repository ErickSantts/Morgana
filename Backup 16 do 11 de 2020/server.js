const express = require('express')
const puppeteer = require('puppeteer')
const cors = require ('cors')
const app = express()

app.use(express.json())
app.use(cors())
const natural = require('natural')


const scrape = async (url) => {
    console.log(url + ' -> url recebida')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(0)
    await page.goto(url)

    const result = await page.evaluate(() => {
        const books = []
        
        document.querySelectorAll('a') //menus laterais nead
            .forEach(book => books.push({ texto: book.text, link: book.href }))

        /*if (books){
            document.querySelectorAll('div > ul > li > a')
            .forEach(book => books.push({ texto: book.text, link: book.href }))
        }
        else if(books){
            document.querySelectorAll('div > div > h2 > a') //menus centrais nead
            .forEach(book => books.push({ texto: book.text, link: book.href }))
        }
        else if(books){
            document.querySelectorAll('div > div > div > a') //menus superiores nead
            .forEach(book => books.push({ texto: book.text, link: book.href }))
        }
        else if(books){
            document.querySelectorAll('div > p > a') //menus superiores nead
            .forEach(book => books.push({ texto: book.text, link: book.href }))
        }
        else if(books){
            document.querySelectorAll('div > div > div > a') //menus pagina inicial login usuario ensino
            .forEach(book => books.push({ texto: book.text, link: book.href }))
        }
        else if(books){
            document.querySelectorAll('a') //menus pagina inicial login usuario ensino
            .forEach(book => books.push({ texto: book.text, link: book.href }))
        }*/
        console.log('Esse e o resultado -> ' + books)
        
        return books
    })
    
    browser.close()
    console.log(url)
    return result
};
app.get('/', (req, res) => {
    const url = req.query.url
    
    scrape(url).then((resultado) => {         
            res.json(resultado);
     })
    
})

app.get('/natural', (req, res) => {
    const p1 = req.query.palavra1;
    const p2 = req.query.palavra2;   

    resultado(p1, p2).then((resultado) => {
        if(resultado >= 0.85){
            console.log('O resultado entre ' + p1 + ' e ' + p2 + ' é ' + resultado) 
        }
                 
        res.send(resultado);
    })
       
})

const resultado = async (p1, p2) => {
    const resultado = await natural.JaroWinklerDistance(p1,p2, undefined, true).toString()
    return resultado 
}

app.listen(3001, function() {
    console.log('Servidor a todo Vapor escutando na porta 3001!');
})