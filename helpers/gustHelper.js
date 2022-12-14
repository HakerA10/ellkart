let db = require('../config/connection')
let collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('express')
const { catagary_COLLECTION } = require('../config/collection')
let objectId = require('mongodb').ObjectId


module.exports = {
    //get all product
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let product = await db.get().collection(collection.product_COLLECTION).find().toArray()

                resolve(product)
            } catch {

                reject()
            }
        })

    },//view a product
    getProducts: (pId) => {

        return new Promise(async (resolve, reject) => {
            try {
                let product = await db.get().collection(collection.product_COLLECTION).findOne({ _id: ObjectId(pId) });

                resolve(product);
            } catch {

                reject()
            }
        })



    },
    //search
    search: (data) => {
        return new Promise(async (resolve, reject) => {
            try {

                let product
                db.get().collection(collection.product_COLLECTION).createIndex({ productName: "text", brand: "text" }).then((response) => {

                    new Promise(async (resolve, reject) => {
                        product = await db.get().collection(collection.product_COLLECTION).find({ $text: { $search: data } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).toArray()
                        console.log(product);
                        resolve(product)
                    }).then((product) => {
                        if (product == "") {
                            reject()
                        }

                        resolve(product)

                    })
                })



            } catch {
                response.status(400).send({ sucess: false })
                reject()
            }

        })

    },



}