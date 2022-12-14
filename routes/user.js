const { response } = require('express');
var express = require('express');
var router = express.Router();
var userHelper = require('../helpers/userHelper')
const verifyLogin = (req, res, next) => {
  if (req.session.usloggedIn) {
    next()
  } else {
    res.redirect('/user/userLogin')
  }
}

//use4r singup
router.get('/userSingup', (req, res) => {
  res.render('user/userSinup', { title: ' Singup' })
})

router.post('/userSinghup', (req, res) => {

  userHelper.userRegister(req.body).then((response) => {

    if (response.phoneFound) {
      res.render("user/userSinup", { title: " Singup", phfound: true })
    } else {
      res.render("user/userSinup", { title: " Singup", Done: true })
    }

  }).catch((error) => {
    res.redirect('../error')
  })
})
//user Login
router.get('/userLogin', (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0"
  );
  if (req.session.usloggedIn) {
    let user = req.session.user
    res.redirect('/user/userHome')
  } else {
    res.render('user/userLogin', { title: ' Login', "logginErr": req.session.loginErr })
    req.session.loginErr = false
  }


})

router.post('/userLogin', (req, res) => {


  userHelper.douserLogin(req.body).then((response) => {

    if (response.status) {

      req.session.usloggedIn = true
      req.session.user = response.user

      res.redirect('/user/userHome')
    } else {

      req.session.loginErr = true
      res.redirect('/user/userLogin',)
    }

  })
})

//OTP login
router.get('/userOtpLogin', (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0"
  );
  if (req.session.usloggedIn) {
    let user = req.session.user
    res.redirect('/user/userHome')
  } else {
    res.render('user/userOtpLogin', { title: "OTP LOGIN", "logginErr": req.session.loginErr })
    req.session.loginErr = false
  }

})
router.post('/userOtpLogin', (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0"
  );
  userHelper.getDetails(req.body.phone).then((response) => {
    let phone = req.body.phone
    if (response.phoneFound) {
      req.session.user = response.details



      res.render('user/userEnterOtp', { title: " login with otp", phone })




    } else {
      req.session.loginErr = true
      res.redirect('./userOtpLogin')

    }


  })

})

//OTP Verification

router.post('/userEnterOtp', (req, res) => {
  const otp = req.body.OTP;
  let phone = req.body.phone;
  userHelper.veriOtp(otp, phone).then((vetify) => {

    if (vetify) {
      req.session.usloggedIn = true

      res.redirect('/user/userHome')
    } else {

      req.session.loginErr = true
      res.redirect('./userOtpLogin')
    }
  })

})



//logout

router.get('/userLogout', (req, res) => {
  req.session.usloggedIn = false;
  res.redirect('/user/userLogin')
})
//user home
router.get('/userHome', verifyLogin, async (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0"
  );
  let user = req.session.user
  let cartcount = await userHelper.getCartCount(user._id)
  userHelper.getAllProducts().then((product) => {
    res.render('user/userHome', { title: "ELL Kart", us: true, user, product, cartcount })
  }).catch((error) => {
    res.redirect('../error')
  })
})
//view product

router.get('/userProductView/:pid', verifyLogin, async (req, res) => {
  let user = req.session.user
  let proId = req.params.pid
  let cartcount = await userHelper.getCartCount(user._id)
  userHelper.getProducts(proId).then((product) => {

    res.render('user/userProductView', { title: product.productName, us: true, user, product, cartcount })
  }).catch((error) => {
    res.redirect('../error')
  })


})

// add to  cart
router.get('/userAddToCart/:Pid', verifyLogin, (req, res) => {
  let user = req.session.user;
  let productId = req.params.Pid;
  let userId = user._id;
  userHelper.addTocart(productId, userId).then(() => {
    res.redirect('../userCart')
  })


})
//view cart 
router.get('/userCart', verifyLogin, async (req, res) => {
  let user = req.session.user
  let userId = req.session.user._id
  let cartcount = await userHelper.getCartCount(user._id)
  let product = await userHelper.getCartDetails(userId)
  let total = await userHelper.getTotal(userId)


  res.render('user/userCart', { title: "ELL Kart", us: true, user, product, cartcount, total })
})

//cart qunt update
router.post('/userChangeQunty', (req, res, next) => {

  userHelper.userChangeQunty(req.body).then(async (responce) => {
    responce.total = await userHelper.getTotal(req.body.user)

    res.json(responce)

  })

})
// cart remove
router.post('/removeCart', (req, res, next) => {
  userHelper.removeCart(req.body).then((response) => {
    res.json(response)
  })
})
//checkout

router.get('/checkout', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartcount = await userHelper.getCartCount(user._id)
  let total = await userHelper.getTotal(user._id)
  let address = await userHelper.getDefaultAddress(user._id)
  res.render('user/checkout', { title: "ELL Kart", us: true, user, cartcount, total, address })
})

router.post('/checkout/:total', async (req, res) => {


  let product = await userHelper.getcartProductList(req.session.user._id)
  let total = parseInt(req.params.total)

  userHelper.placeOdder(req.body, product, total).then((response) => {
    ordId = response.insertedId;

    if (req.body['paymentmethod'] === 'COD') {

      res.json({ codSuccess: true, ordId })
    }
    else {
      userHelper.genarateRezopay(ordId, total).then((response) => {

        res.json(response)
      })

    }


  })


})
// check out placed confomation
router.get('/odderplaced/:rid', verifyLogin, async (req, res) => {
  try {
    let user = req.session.user
    let resId = req.params.rid;
    let cartcount = await userHelper.getCartCount(req.session.user._id)
    let odderDetils = await userHelper.getodderdetails(resId)

    res.render('user/odderplaced', { title: "Odder Placed", us: true, user, cartcount, odderDetils, resId })
  } catch {
    res.redirect('../error')
  }

})

//view odder details
router.get('/userOdderdetails', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartcount = await userHelper.getCartCount(req.session.user._id)
  let odderdetails = await userHelper.getooderdetails(req.session.user._id)
  let countodder = odderdetails.length

  res.render('user/odderdetails', { title: "Odder Details", us: true, user, cartcount, odderdetails, countodder })
})
//view odder details with with product
router.get('/userodderviewpage/:orid', verifyLogin, async (req, res) => {


  try {
    let odderId = req.params.orid
    let user = req.session.user
    let cartcount = await userHelper.getCartCount(req.session.user._id)
    let odder = await userHelper.getOdderdetails(odderId)
    let odderproduct = await userHelper.getOdderProductdetails(odderId)


    let adddetails = {}


    if (odder[0].status == 'placed') {
      adddetails.placed = true
    }
    else if (odder[0].status == 'Accepted') {
      adddetails.accepted = true
    }
    else if (odder[0].status == 'Packed') {
      adddetails.packed = true
    }
    else if (odder[0].status == 'Shipped') {
      adddetails.shipped = true
    }
    else if (odder[0].status == 'Delivered') {
      adddetails.delivered = true
      adddetails.cancel = true
    }
    else if (odder[0].status == 'Waiting For Approval') {
      adddetails.Waiting = true
      adddetails.cancel = true

    }
    else if (odder[0].status == 'Approval') {
      adddetails.Approval = true
      adddetails.cancel = true

    }
    else if (odder[0].status == 'Returned') {
      adddetails.Returned = true
      adddetails.cancel = true

    }

    else {
      adddetails.cancel = true
    }





    res.render('user/viewodderdetails', { title: "Odder Details", us: true, user, cartcount, odder, odderproduct, adddetails })
  } catch {

    res.redirect('../error')
  }



})

//odder cancel

router.get('/cancelOdder/:odId', verifyLogin, (req, res) => {
  let odderId = req.params.odId


  userHelper.cencelodder(odderId).then((response) => {

    res.redirect('../userodderviewpage/' + odderId)
  }).catch((error) => {
    res.redirect('../error')
  })

})

//profile
router.get('/userProfile', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartcount = await userHelper.getCartCount(user._id)
  let address = await userHelper.getAddress(user._id)

  res.render('user/userProfile', { title: "ELL Kart Profile", us: true, user, cartcount, address })

})
//address 
router.post('/useraddress/:id', verifyLogin, (req, res) => {
  let user = req.session.user
  let adId = req.params.id;

  userHelper.updateAddress(adId, req.body).then(() => {
    res.redirect('../userProfile')
  }).catch((error) => {
    res.redirect('../error')
  })

})

//update user info
router.post('/userInfoUpedate', verifyLogin, (req, res) => {
  let user = req.session.user
  userHelper.userinfoUpdate(user._id, req.body).then(() => {
    res.redirect('./userProfile')
  }).catch((error) => {
    res.redirect('../error')
  })

})
router.post('/verifyPayment', (req, res) => {
  userHelper.verfiyPayment(req.body).then(() => {


    userHelper.changePayemengtStatus(req.body['order[receipt]']).then(() => {



      res.json({ status: true, ordId })

    })



  }).catch((err) => {
    res.json({ status: false, ordId, err })
  })
})

router.post('/paymentfailed', (req, res) => {
  userHelper.paymentfailed(ordId).then(() => {
    res.json({ failed: true, ordId })

  })
})
//return
router.post('/return/:id', (req, res) => {
  let ordId = req.params.id;
  userHelper.orderReturn(ordId, req.body).then(() => {
    res.redirect('../userodderviewpage/' + ordId)
  })

})
//coupen
router.get('/userCoupen', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartcount = await userHelper.getCartCount(user._id)
  let coupen = await userHelper.getcoupen()

  res.render('user/userCoupen', { title: "ELL Kart ", us: true, user, cartcount, coupen })

})


router.post('/couponCheck', (req, res) => {
  let code = req.body.code;

  userHelper.checkCoupen(code).then((data) => {

    let value = data.value
    res.json({ value })
  }).catch((err) => {

    res.json({ err: true })
  })

})
//search
router.post('/search', (req, res) => {
  let search = req.body.search


  userHelper.search(search).then(async (product) => {
    let user = req.session.user
    let cartcount = await userHelper.getCartCount(user._id)

    res.render('user/userHome', { title: "ELL Kart", us: true, user, product, cartcount })
  }).catch(async () => {
    let user = req.session.user
    let cartcount = await userHelper.getCartCount(user._id)
    res.render('user/userHome', { title: "ELL Kart", us: true, user, notfunt: true, cartcount })
  })
})
//add address

router.get('/addAddress', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartcount = await userHelper.getCartCount(user._id)
  res.render('user/userNewAddress', { title: "ELL Kart ", us: true, user, cartcount })
})


router.post('/addAddress', verifyLogin, async (req, res) => {
  let user = req.session.user
  let details = req.body
  details.userId = user._id;
  details.default = false;


  userHelper.addAddress(details).then((data) => {
    res.redirect('./userProfile')
  })

})

//address update
router.get('/addressUpdate/:id', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartcount = await userHelper.getCartCount(user._id)
  let adId = req.params.id;
  userHelper.getOneAddress(adId).then((address) => {
    res.render('user/updateAddress', { title: "ELL Kart", us: true, user, cartcount, address })
  }).catch(() => {
    res.redirect('../error')
  })
  //change default
  router.get('/addressDefault/:id', (req, res) => {
    let user = req.session.user
    let adId = req.params.id;

    userHelper.changeDefaultAddress(adId, user._id).then(() => {

      userHelper.changeDefaultAddress1(adId).then(() => {

        res.redirect('../userProfile')
      })


    })

  })


  //error
  router.get('/error', verifyLogin, (req, res) => {
    let user = req.session.user
    res.render('user/userError', { us: true, user, title: "ELL Kart" })
  })


})

//Forgot password
router.get('/forgotPassword', (req, res) => {

  res.render('user/userForgotPassword', { title: "Ell Kart" })
})

router.post('/forgotPassword', (req, res) => {

  userHelper.getDetails(req.body.phone).then((response) => {
    let phone = req.body.phone
    if (response.phoneFound) {
      res.render('user/userfgOTP', { title: "Ell Kart", phone })
    } else {
      req.session.logginErr = true
      res.redirect('./forgotPassword')
    }
  })
})
router.post('/userFPOTPVerification', (req, res) => {
  const otp = req.body.OTP;
  let phone = req.body.phone;
  userHelper.veriOtp(otp, phone).then((vetify) => {

    if (vetify) {
      res.render('user/userChangePassword', { title: "Ell Kart", phone })
    } else {

      req.session.loginErr = true
      res.redirect('./forgotPassword')
    }
  })

})
router.post('/userChangePassword', (req, res) => {

  userHelper.changePassword(req.body).then((status) => {
    console.log(status);
    if (status) {
      req.session.changepass = true
      res.redirect('./userCPProfile')
    } else { res.redirect('./userLogin') }


  }).catch(() => {
    res.redirect('../error')
  })

})
router.get('/userCPProfile', verifyLogin, async (req, res) => {
  let user = req.session.user
  console.log(user);
  let cartcount = await userHelper.getCartCount(user._id)
  let status = req.session.changepass
  res.render('user/userCPProfile', { title: "ELL Kart Profile", us: true, user, cartcount, status })
  req.session.changepass = false
})


module.exports = router;
