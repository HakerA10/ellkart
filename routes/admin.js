

const express = require('express');
const router = express.Router();
const adminHelper = require('../helpers/adminHelper')
const excelJs = require("exceljs");

const verifyLogin = (req, res, next) => {

    if (req.session.adloggedIn) {
        next()
    } else {
        res.redirect('/admin')
    }
}
/* GET home page. */
router.get('/', function (req, res, next) {
    if (req.session.adloggedIn) {
        let admin = req.session.admin
        res.render('admin/adminHome', { title: 'admin Home', ad: true, admin })
    } else {
        res.render('admin/adminlogin', { title: 'admin Login', "logginErr": req.session.loginErr });
        req.session.loginErr = false
    }

});
//admin Login checks here
router.post('/', function (req, res, next) {

    adminHelper.doAdminLogin(req.body).then((response) => {

        if (response.status) {
            req.session.adloggedIn = true
            req.session.admin = response.admin
            res.redirect('/admin/adminHome')
        } else {
            req.session.loginErr = true
            res.redirect('/admin',)
        }

    })
});
//Admin home page
router.get('/adminHome', verifyLogin, async (req, res) => {
    try {
        let admin = req.session.admin
        let allCount = {}
        allCount.usercount = await adminHelper.usercount()
        allCount.productCount = await adminHelper.productcount()
        allCount.odderCount = await adminHelper.odderctcount()
        allCount.totalSalse = await adminHelper.totalSalse()
        SalesReport = await adminHelper.weeklySeals()
        productReport = await adminHelper.getProductReport()



        res.render('admin/adminHome', { title: "Admin Home", ad: true, admin, allCount, SalesReport, productReport })
    } catch {
        let admin = req.session.admin
        let allCount = {}
        allCount.usercount = 0
        allCount.productCount = 0
        allCount.odderCount = 0
        allCount.totalSalse = 0
        SalesReport = 0



        res.render('admin/adminHome', { title: "Admin Home", ad: true, admin, allCount, SalesReport })
    }


})

//salse report
router.get('/salseReport', verifyLogin, async (req, res) => {

    adminHelper.Allodders().then((odders) => {


        res.render('admin/saleReport', { title: "ELL Kart Sale", ad: true, odders })
    }).catch(() => {
        res.render('./error')
    })

})
//logout

router.get('/logout', (req, res) => {
    req.session.adloggedIn = false;
    res.redirect('/admin')
})

//login with OTP
router.get('/adminLoginOtp', (req, res) => {

    if (req.session.adloggedIn) {
        let admin = req.session.admin
        res.redirect('./adminHome')
    } else {
        res.render('admin/adminLoginOtp', { title: 'admin Login', "logginErr": req.session.loginErr });
        req.session.loginErr = false
    }


})
//resent otp
router.get('/adminResendOtp', (req, res) => {
    res.redirect('./adminLoginOtp')


})

router.post('/adminLoginOtp', (req, res) => {

    adminHelper.getDetails(req.body.phone).then((response) => {
        let phone = req.body.phone
        if (response.phoneFound) {
            req.session.admin = response.details
            res.render('admin/adminEnterOtp', { title: "Admin login with otp", phone })
        } else {
            req.session.loginErr = true
            res.redirect('./adminLoginOtp')

        }


    })

})
//OTP Verification

router.post('/adminOtpEnter', (req, res) => {
    const otp = req.body.OTP;
    let phone = req.body.phone;
    adminHelper.veriOtp(otp, phone).then((vetify) => {

        if (vetify) {
            req.session.adloggedIn = true
            // req.session.admin = admin

            res.redirect('/admin/adminHome')
        } else {

            req.session.loginErr = true
            res.redirect('./adminLoginOtp')
        }
    })

})

//user list info
router.get('/adminUserList', verifyLogin, (req, res) => {
    let admin = req.session.admin
    adminHelper.getAllUser().then((user) => {
        let count = user.length;
        res.render('admin/adminUserList', { title: "ELL Admin", ad: true, admin, user, count })
    })

})
//block user
router.get('/adminUserBlock/:usId', verifyLogin, (req, res) => {

    adminHelper.blockUser(req.params.usId).then(() => {
        res.redirect('../adminUserList')
    })
})
//unblock user
router.get('/adminUserunblock/:usId', verifyLogin, (req, res) => {

    adminHelper.unblockUser(req.params.usId).then(() => {
        res.redirect('../adminUserList')
    })
})

// catagary manage ment
router.get('/adminCatagary', verifyLogin, (req, res) => {
    let admin = req.session.admin
    adminHelper.getAllcatagary().then((cat) => {
        //    let count=cat.length;

        res.render('admin/adminCatagaery', { title: "ELL Admin", ad: true, admin, cat })
    })
})


router.post('/addcatagarory', verifyLogin, (req, res) => {

    adminHelper.addcatagarory(req.body).then((response) => {

        res.redirect('/admin/adminCatagary')
    })
})

//delect catagary
router.get('/adminCatagaryDelect/:usId', verifyLogin, (req, res) => {

    let catid = req.params.usId

    adminHelper.catDelect(catid).then((response) => {
        res.redirect('/admin/adminCatagary')
    })


})


//add product router
router.get('/adminAddeProduct', verifyLogin, (req, res) => {
    let admin = req.session.admin
    // adminHelper.addcatagarory().then((catagary) => {
    // })

    adminHelper.getAllCatgary().then((catagary) => {

        res.render('admin/adminAddProduct', { title: "Add Products", ad: true, admin, catagary })
    })

})

router.post('/adminAddProduct', verifyLogin, (req, res) => {

    let admin = req.session.admin
    //offer calculation
    let mrp = parseInt(req.body.mrp);
    let rtp = parseInt(req.body.retailerPrice);
    let offer = parseInt(100 - ((rtp / mrp) * 100))
    req.body.offer = offer;



    adminHelper.adminAddProduct(req.body, (result) => {
        let photo1 = req.files.photo1;
        photo1.mv('./public/product-photo1/' + result + '.jpg')

        let photo2 = req.files.photo2;
        photo2.mv('./public/product-photo2/' + result + '.jpg')
        let photo3 = req.files.photo3;
        photo3.mv('./public/product-photo3/' + result + '.jpg', (err, done) => {
            if (!err) {
                res.render('admin/adminAddProduct', { title: "Add Products", ad: true, admin, done: true })
            }
            else {

            }
        })

    })
})

//view Product
router.get('/adminViewProduct', verifyLogin, (req, res) => {
    let admin = req.session.admin
    adminHelper.getAllProducts().then((product) => {
        let count = product.length;
        res.render('admin/adminProductManagement', { title: "ELL Admin", ad: true, admin, product, count })
    })

})
//view Product in admin side
router.get('/adminViewProductEdit/:pid', verifyLogin, async (req, res) => {

    let proId = req.params.pid
    catagary = await adminHelper.getAllCatgary();

    adminHelper.getProducts(proId).then((product) => {

        res.render('admin/adminViewProduct', { title: "ELL Admin", ad: true, product, catagary })
    })


})
//Edit Product
router.post('/adminEditProduct/:id', verifyLogin, (req, res) => {
    let mrp = parseInt(req.body.mrp);
    let rtp = parseInt(req.body.retailerPrice);

    let offer = parseInt(100 - ((rtp / mrp) * 100))
    req.body.offer = offer;

    adminHelper.updateProduct(req.params.id, req.body).then(() => {

        res.redirect('../adminViewProduct')
        try {
            if (req.files.photo1) {
                let photo1 = req.files.photo1;
                photo1.mv('./public/product-photo1/' + req.params.id + '.jpg')
            }
            if (req.files.photo2) {
                let photo2 = req.files.photo2;
                photo2.mv('./public/product-photo2/' + req.params.id + '.jpg')
            }
            if (req.files.photo3) {
                let photo3 = req.files.photo3;
                photo3.mv('./public/product-photo3/' + req.params.id + '.jpg')
            }
        } catch {

        }



    })
})
// Delect Product
router.get('/adminDelProduct/:id', verifyLogin, (req, res) => {
    let proId = req.params.id

    adminHelper.deleteProduct(proId).then((response) => {
        res.redirect('../adminViewProduct')
    })

})
//odder management

router.get('/adminOddermanage', verifyLogin, (req, res) => {
    let admin = req.session.admin
    adminHelper.Allodders().then((odders) => {

        res.render('admin/odderManagement', { title: "ELL Admin", ad: true, odders })

    }).catch((error) => {

    })


})


router.get('/adminViewOdderUp/:ordId', verifyLogin, async (req, res) => {
    let odderId = req.params.ordId;
    let admin = req.session.admin
    let prodetails = await adminHelper.getoddersProductDetails(odderId)
    adminHelper.odderDetails(odderId).then((odderDetails) => {



        res.render('admin/adminodderView', { title: "ELL Admin", ad: true, odderDetails, prodetails })

    }).catch((error) => {

    })

})

//odder cancel
router.post('/cancleOdder/:ordId', (req, res) => {
    let odderId = req.params.ordId
    let remark = req.body.remark
    adminHelper.cencelodder(odderId, remark).then((response) => {

        res.redirect('../adminViewOdderUp/' + odderId)
    }).catch((error) => {
        res.render('/error', { error })
    })

})

//update status
router.post('/odderstatusupdate/:ordId', (req, res) => {
    let odderId = req.params.ordId
    let status = req.body.status
    adminHelper.updateOdderstatus(odderId, status).then((response) => {

        res.redirect('../adminViewOdderUp/' + odderId)
    }).catch((error) => {
        res.render('/error', { error })
    })

})
//salse repot Exel
router.get("/exportExcel", async (req, res) => {

    let SalesReport = await adminHelper.getTotalSalesReport();


    try {
        const workbook = new excelJs.Workbook();

        const worksheet = workbook.addWorksheet("Sales Report");

        worksheet.columns = [
            { header: "S no.", key: "s_no" },
            { header: "OrderID", key: "_id" },
            { header: "User", key: "name" },
            { header: "Date", key: "date" },
            { header: "Products", key: "products" },
            { header: "Method", key: "paymentmethod" },
            { header: "status", key: "status" },
            { header: "Amount", key: "total" },
        ];
        let counter = 1;
        SalesReport.forEach((report) => {
            report.s_no = counter;
            report.products = "";
            report.name = report.users[0].name;



            report.product.forEach((eachProduct) => {
                report.products += eachProduct.productName + ",";
            });
            worksheet.addRow(report);
            counter++;
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });


        res.header(
            "Content-Type",
            "application/vnd.oppenxmlformats-officedocument.spreadsheatml.sheet"
        );
        res.header("Content-Disposition", "attachment; filename=report.xlsx");

        workbook.xlsx.write(res);
    } catch (err) {


    }
});
router.get("/adminReturn", verifyLogin, async (req, res) => {
    adminHelper.allReturn().then((odders) => {
        approvel = false
        if (odders.status == 'Approval') {
            approvel = true
        }
        res.render('admin/adminRetuenView', { title: "ELL Admin", ad: true, odders, approvel })

    })
})
router.get("/returnApprovel/:id", verifyLogin, async (req, res) => {
    ordId = req.params.id
    await adminHelper.returnApprovel(ordId).then(() => {

        res.redirect('../adminReturn')

    })
})
//coupen
router.get("/coupen", verifyLogin, (req, res) => {
    adminHelper.allcoupen().then((coupen) => {
        res.render('admin/coupen', { title: "ELL Admin", ad: true, coupen })
    })

})
router.post("/coupen", (req, res) => {
    req.body.value = parseInt(req.body.value)
    adminHelper.addCoupen(req.body).then(() => {
        res.redirect("./coupen")
    }).catch((data) => {
        adminHelper.allcoupen().then((coupen) => {
            let message = data.message;
            res.render('admin/coupen', { title: "ELL Admin", ad: true, coupen, message })
        })
    })
})

router.get('/coupenDelect/:coupenId', verifyLogin, (req, res) => {

    let coupenId = req.params.coupenId

    adminHelper.coupenDelect(coupenId).then((response) => {
        res.redirect('/admin/coupen')
    })


})


module.exports = router;
