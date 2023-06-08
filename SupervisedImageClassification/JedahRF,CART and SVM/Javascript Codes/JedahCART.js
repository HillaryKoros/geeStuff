var collection = ee.ImageCollection('COPERNICUS/S2') 
  // .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .sort('CLOUDY_PIXEL_PERCENTAGE')
  .filterDate('2023-01-01' ,'2023-05-30') 
  .filterBounds(geometry)
  
Map.centerObject(geometry,6)
// Map.addLayer(geometry,{},'bounds')
print(collection) 

var medianpixels = collection.median()  

var medianpixelsclipped = medianpixels.clip(geometry).divide(10000)
// var medianpixelsclipped = collection.clip(geometry).divide(10000)

// print(medianpixelsclipped)

Map.addLayer(medianpixelsclipped, {bands: ['B4', 'B3', 'B2'], min: 0, max: 1, gamma: 1.5}, 'Sentinel_2 true color')


var trainingData = Water.merge(Barren).merge(Vegetation).merge(Street).merge(Buildings);
print(trainingData)



// Use these bands for prediction.
var bands = ['B2','B3', 'B4', 'B5','B6', 'B7','B8','B8A','B11','B12'];
// This property stores the land cover labels as consecutive
// integers starting from zero in our training data.
var label = 'landcover';

// Overlay the points on the imagery with median pixels to get training.
var training =  medianpixelsclipped.select(bands).sampleRegions({
  collection: trainingData,
  properties: [label],
  scale: 10
});

// print(training.first())// check 


// Train a CART classifier with max nodes of 15.
var classifier= ee.Classifier.smileCart(15).train(training, label, bands);
// print (trained)

// Classify the image with the same bands used for training.
var classified = medianpixelsclipped.select(bands).classify(classifier);


var Palette = [
      
  '#0790f7', // Water
  '#e06666', // Barren
  '#4ae009', // Vegetation
  '#ff0000' // Buildings
  ];

//add the classified image to the map
Map.addLayer(classified, {min: 1, max: 5, palette: Palette}, "LULC Jeddah");


// Get a confusion matrix and overall accuracy for the training sample.
var trainAccuracy = classifier.confusionMatrix();
print('Training error matrix', trainAccuracy);
print('Training overall accuracy', trainAccuracy.accuracy());

// var viz = {min: 1, max: 5, palette: Palette}


// Export.image.toDrive({
//     image: classified,
//     description: 'Classified_CART',
//     folder: 'Jedah',  
//     region: geometry, 
//     scale: 10,
//     maxPixels: 1e13,
//     }); 
 