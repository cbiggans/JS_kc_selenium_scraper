Installation
============
Add `<project_root>/bin` to env PATH in `~/.bashrc`
* `export PATH="/home/cbiggans/programming/node/js_kc_selenium_scraper/bin/:$PATH"`
Load env w/ `source`
* `source ~/.bashrc`
Install all the other packages using npm
* `npm install`

* Be sure to add each item to your $PATH in the `.bashrc` or `.profile` files.
* These files should probably be added to the `~/.local` directory

Install Node
* https://nodejs.org/en/

Install Java
* https://www.guru99.com/installing-selenium-webdriver.html

Install Selenium
* https://www.seleniumhq.org/download/
** Will want to choose the Javascript (NODE) webdriver
** `npm install --save selenium-webdriver`

Put Chromedriver in Path
* `export PATH=bin/$(pwd):$PATH`
