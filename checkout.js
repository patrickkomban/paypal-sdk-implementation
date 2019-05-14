router.post('/checkout-process', function(req, res) {
  let cart = new Cart(req.session.cart);
  let totalPrice = (req.session.cart.discountPrice > 0) ? req.session.cart.discountPrice : cart.totalPrice;

  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://134.117.216.199:3000/checkout/checkout-success",
        "cancel_url": "http://134.117.216.199:3000/checkout/checkout-cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Clothing Items",
                "sku": "001",
                "price": totalPrice.toString(),
                "currency": "CAD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "CAD",
            "total": totalPrice.toString()
        },
        "description": "All items purchased from Yard and Garden Store"
    }]
  }

  paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
    }
  })

});

router.get('/checkout-success', ensureAuthenticated, function(req, res) {
  let cart = new Cart(req.session.cart);
  let totalPrice = (req.session.cart.discountPrice > 0) ? req.session.cart.discountPrice : cart.totalPrice;
  let payerId = req.query.PayerID;
    let paymentId = req.query.paymentId;

    let execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "CAD",
              "total": totalPrice.toString()
          }
      }]
    }

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));

        cart.items = {}
        cart.totalQty = 0
        cart.totalPrice = 0
        cart.discountPrice = 0
        cart.userId = req._userId

        req.session.cart = cart

        res.render('checkoutSuccess', {
          title: 'Successful',
          containerWrapper: 'container'
        })
        let newOrder = new Order({
                orderID             : payment.id,
                username            : req.user.username,
                address             : `${payment.payer.payer_info.shipping_address.line1} ${payment.payer.payer_info.shipping_address.city} ${payment.payer.payer_info.shipping_address.state}`,
                orderDate           : payment.create_time,
                shipping            : true
        })
        newOrder.save()
      }
   })
});

router.get('/checkout-cancel', ensureAuthenticated, function(req, res) {
  res.render('checkoutCancel', {
    title: 'Successful',
    containerWrapper: 'container'
  });
});
