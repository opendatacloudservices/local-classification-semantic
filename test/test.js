const dotenv = require('dotenv');
const path = require('path');
dotenv.config({path: path.join(__dirname, '../.env')});

const {removeStopwords} = require('../build/taxonomies/index');

test('stopwords', async () => {
  const testArray = [
    {value: 'die arbeitslosenzahlen'},
    {value: 'zweiter-datensatz'},
    {value: 'im waldwinkel'},
  ];

  const resultArray = removeStopwords(testArray);

  expect(resultArray[0].value).toBe('arbeitslosenzahlen');
  expect(resultArray[1].value).toBe('datensatz');
  expect(resultArray[2].value).toBe('waldwinkel');
});

const {get} = require('../build/translation/index');

test('translation', async () => {
  const translation = await get('Hello World', 'de');
  expect(translation).toBe('Hallo Welt');
});

test('bad translation', async () => {
  const badString = '123-bb-88d-4';
  const translation = await get(badString, 'en');
  expect(translation).toBe(badString);
});
