const { response } = require('express');
var express = require('express');
var router = express.Router();
var userHelper = require('../helpers/userHelper')
const verifyLogin = (req, res, next) => {
  if (req.session.usloggedIn) {
    next()
  } else {
    res.redirect('user/userLogin')
  }
}

//use4r sungup
router.get('/userSingup', (req, res) => {
  res.render('user/userSinup', { title: 'User Singup' })
})

router.post('/userSinghup', (req, res) => {

  userHelper.userRegister(req.body).then((response) => {

    if (response.phoneFound) {
      res.render("user/userSinup", { title: "User Singup", phfound: true })
    } else {
      res.render("user/userSinup", { title: "User Singup", Done: true })
    }

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
    res.render('user/userLogin', { title: 'User Login', "logginErr": req.session.loginErr })
    req.session.loginErr = false
  }


})

router.post('/userLogin', (req, res) => {


  userHelper.douserLogin(req.body).then((response) => {

    if (response.status) {

      req.session.usloggedIn = true
      req.session.user = response.user
      console.log(req.session.user);
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



      res.render('user/userEnterOtp', { title: "user login with otp", phone })




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
    console.log(vetify);
    if (vetify) {
      req.session.usloggedIn = true
      console.log("otp success");
      res.redirect('/user/userHome')
    } else {
      console.log("otp failed");
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
router.get('/userHome', (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0"
  );
  let user = req.session.user
  userHelper.getAllProducts().then((product) => {
    res.render('user/userHome', { title: "user Home", us: true, user, product })
  })
  //view product

  router.get('/userProductView/:pid', verifyLogin, (req, res) => {

    let proId = req.params.pid
    userHelper.getProducts(proId).then((product) => {
      console.log("here");
      res.render('user/userProductView', { title: product.productName, us: true, user, product })
    })


  })

})



module.exports = router;
