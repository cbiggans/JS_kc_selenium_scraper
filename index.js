'use strict';

const fetch = require('node-fetch')
const url = require('url')

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
const {Builder, By, Key, until} = require('selenium-webdriver');


async function findElementById(driver, id) {
  return await driver.findElement(By.id(id))
}

async function findElementsByClassName(driver, className) {
  return await driver.findElements(By.className(className))
}

async function findElementByName(driver, name) {
  return await driver.findElement(By.name(name))
}

async function clickEl(driver, el) {
  await driver.executeScript('arguments[0].click();', el)
}


function clickId(driver, id) {
    clickEl(driver, findElementById(driver, id))
}


function setupDriver() {
    var builder = new webdriver.Builder().forBrowser('chrome')

    var chromeOptions = new chrome.Options();
    chromeOptions.addArguments(['--headless'])
    builder.setChromeOptions(chromeOptions);

    return builder.build();
}

async function launchTaxAccessor(driver) {
    await driver.get('http://blue.kingcounty.com/Assessor/eRealProperty/default.aspx')

    var inputBoxId = 'cphContent_checkbox_acknowledge'
    await clickId(driver, inputBoxId)
}

async function sendTextById(driver, id, text) {
    var el = await findElementById(driver, id)
    await el.sendKeys(text)
}

async function sendTextByEl(el, text) {
    // console.log(el)
    await el.sendKeys(text)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForId(driver, id) {
  var el = null
  while(!el) {
    try {
      el = await findElementById(driver, id)
      console.log('FOUND: ', id)
    } catch {
      el = null
      console.log('ELEMENT NOT FOUND - TRYING AGAIN, ID: ', id)
      // await sleep(100)
    }
  }

  return el
}

async function searchByAddress(driver, address, city, zipcode) {
  var addressTextboxId = 'cphContent_txtAddress'
  var cityTextboxId = 'cphContent_txtCity'
  var zipcodeTextboxId = 'cphContent_txtZip'
  var searchButtonId = 'cphContent_btn_SearchAddress'

  // Make sure this element is loaded on the page before continuing
  await waitForId(driver, addressTextboxId)

  // Populate the search boxes
  await sendTextById(driver, addressTextboxId, address)
  await sendTextById(driver, cityTextboxId, city)
  await sendTextById(driver, zipcodeTextboxId, zipcode)

  // Press the Search Button
  clickId(driver, searchButtonId)
}

async function getParcelNumByUrl(driver) {

  var parcelNum = null
  while(!parcelNum) {
    var currentURL = await driver.getCurrentUrl()
    var query = url.parse(currentURL).query
    if(query) {
      parcelNum = query.split('=')[1]
    }
    console.log('Query => ' + query)
  }

  console.log('parcelNum = ' + parcelNum)
  return parcelNum
}

async function gotoPropertyDetail(driver) {
  clickId(driver, 'cphContent_LinkButtonDetail')
}

async function getElTextById(driver, id) {
  var el = await findElementById(driver, id)
  var text = await el.getText()

  return text
}

async function getLandData(driver) {
  var landDataId = 'cphContent_DetailsViewLand'

  await waitForId(driver, landDataId)

  var text = await getElTextById(driver, landDataId)

  return text
}

async function getBuildingData(driver) {
  var buildingDataId = 'cphContent_DetailsViewResBldg'

  await waitForId(driver, buildingDataId)

  var text = await getElTextById(driver, buildingDataId)

  return text
}

async function getTaxHistoricalData(driver) {
  const taxHistoricalDataId = 'cphContent_GridViewTaxRoll'

  await waitForId(driver, taxHistoricalDataId)

  var text = await getElTextById(driver, taxHistoricalDataId)

  return text
}

async function launchPropertyTaxSite(driver) {
  await driver.get('https://payment.kingcounty.gov/Home/Index?app=PropertyTaxes')
}

async function searchTaxAccountNum(driver, parcelNum) {
    var inputFieldName = 'searchParcel'

		var searchField = await findElementByName(driver, inputFieldName)
    await sendTextByEl(searchField, parcelNum)

    var els = []
    while(els.length === 0) {
      els = await findElementsByClassName(driver, "input-group-btn")
    }

    var searchButtonEl = els[0]

    var buttonEls = await findElementsByClassName(searchButtonEl, 'btn-primary')
    var buttonEl = buttonEls[0]

    driver.actions()
          .move({origin: searchButtonEl})
          .click(buttonEl)
          .perform()
}

async function getCookies(driver) {
  var cookies = await driver.manage().getCookies()

  // console.log('COOKIES: ', cookies)
  var result = {}
  await cookies.forEach(function(cookie) {
      result[cookie['name']] = cookie['value']
  })
  // console.log('==================COOKIES============================')
  // console.log('RESULT: ', result)

  return result
}

async function getMailingAddress(driver, parcelNum) {
	var url = 'https://payment.kingcounty.gov/Home/TenantCall?app=PropertyTaxes'

  var cookies = await getCookies(driver)
  var headers = {
      'Content-Type': 'application/json',
      'Cookie': 'payment.kingcounty.gov=' + cookies['payment.kingcounty.gov'] + ';'
  }
  var body = '{"path": "RealProperty/' + parcelNum + '", "captchatoken":""}'

  var data = await fetch('https://payment.kingcounty.gov/Home/TenantCall?app=PropertyTaxes', {
    method: 'POST',
    headers: headers,
    body: body,
  })
  .then(response => {
    // console.log(response)
    return response.json()
  })
  .then(resp => {
    return JSON.parse(resp).data[0]
  })

  var address1 = data.address1.trim()

  var addrList = data.address2.split(' ')
  var address2 = addrList[0] + ', ' + addrList[1] + ' ' + addrList[addrList.length-1]

  var mailingAddress = address1 + ', ' + address2
  console.log('Mailing Address: ', mailingAddress)

  return mailingAddress
}

async function main() {
  var driver = setupDriver()

  await launchTaxAccessor(driver)

  await searchByAddress(driver, '18610 4th Ave S', 'Burien', '98148')

  var parcelNum = await getParcelNumByUrl(driver)

  await gotoPropertyDetail(driver)

  var landData = await getLandData(driver)
  // console.log('LAND DATA: ')
  // console.log(landData)

  var buildingData = await getBuildingData(driver)
  // console.log('BUILDING DATA: ')
  // console.log(buildingData)

  var taxHistoricalData = await getTaxHistoricalData(driver)
  // console.log('Tax Historical Data: ')
  // console.log(taxHistoricalData)

  // Switch sites to get mailing info of owner
  await launchPropertyTaxSite(driver)
  await searchTaxAccountNum(driver, parcelNum)

  var mailingAddress = await getMailingAddress(driver, parcelNum)
  // console.log(mailingAddress)
  
  driver.close()
}

main()
