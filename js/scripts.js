/*
* ---------------------------------------------------------------------------
* Created by Diego Salazar
* https://gist.github.com/DiegoSalazar/4075533
*
* Takes the form field value and returns true on valid number.
* ---------------------------------------------------------------------------
*/
function valid_credit_card(value) {
  // accept only digits, dashes or spaces
	if (/[^0-9-\s]+/.test(value)) return false;

	// The Luhn Algorithm. It's so pretty.
	var nCheck = 0, nDigit = 0, bEven = false;
	value = value.replace(/\D/g, "");

	for (var n = value.length - 1; n >= 0; n--) {
		var cDigit = value.charAt(n),
			  nDigit = parseInt(cDigit, 10);

		if (bEven) {
			if ((nDigit *= 2) > 9) nDigit -= 9;
		}

		nCheck += nDigit;
		bEven = !bEven;
	}

	return (nCheck % 10) == 0;
}

/*
* ---------------------------------------------------------------------------
* Validates the expiration date.
* ---------------------------------------------------------------------------
*/
function validExpirationDate( date ) {
    var currentDate = new Date(),
        currentMonth = currentDate.getMonth() + 1, // Zero based index
        currentYear = currentDate.getFullYear(),
        expirationMonth = Number( date.substr( 0, 2 ) ),
        expirationYear = Number( date.substr( 3, date.length ) );

    // The expiration date must be atleast 1 month ahead of the current date.
    if ( ( expirationYear < currentYear ) || ( expirationYear == currentYear && expirationMonth <= currentMonth ) ) {
        return false;
    }

    return true;
}

/*
* ---------------------------------------------------------------------------
* Validates the security code(CVV).
* ---------------------------------------------------------------------------
*/
function validCVV( cvv ) {
    // The CVV must be atleast 3 digits.
    return cvv.length > 2;
}

/*
* ---------------------------------------------------------------------------
* Retrieve the card issuing bank.
* ---------------------------------------------------------------------------
*/
function getCardType ( ccNumber ) {
	// Define regular expressions.
	var cardPatterns = {
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/
        };

    for ( var cardPattern in cardPatterns ) {
        if ( cardPatterns[cardPattern].test( ccNumber ) ) {
            return cardPattern;
        }
    }

	// If nothing matches, return false.
	return false;
}


/*
* ---------------------------------------------------------------------------
* On document ready.
* ---------------------------------------------------------------------------
*/
$( function() {
    var number = $( "#cc-number" ),
        expDate = $( "#cc-expiration-date" ),
        cvv = $( "#cc-cvv" ),
        paymentButton = $( "#submit-payment" ),
        ccInputs = $( ".cc-input" ),
        timerInterval = 1000,
        timer,
        numberOK = false,
        expDateOK = false,
        cvvOK = false;

    // Set the masks.
    number.inputmask( "9999 9999 9999 9[999] [999]", { "placeholder": " " } );
    expDate.inputmask( "mm/yyyy" );
    cvv.inputmask( "999[9]", { "placeholder": " " } );

    // Focus the first field.
    number.focus();

    // On keyup we set a timer after which we trigger the finishTyping() function.
    ccInputs.keyup( function( e ) {
        // If the pressed keys are not Tab or Shift+Tab we clear the current timer and start a new one.
        if ( e.keyCode != '9' && e.keyCode != '16' ) {
            clearTimeout( timer );
            timer = setTimeout( finishTyping, timerInterval, $( this ).attr( "id" ), $( this ).val() );
        }
    } );

    // On keydown we stop the current timer.
    ccInputs.keydown( function() {
        clearTimeout( timer );
    } );

    // On field focus, we add the active class on the corresponding span in the page subtitle.
    ccInputs.focus( function() {
        $( "#title-" + $( this ).attr( "id" ) ).addClass( "active" );
    } );

    // On field blur we remove the active class from all items.
    ccInputs.blur( function() {
        $( "h2 span" ).removeClass( "active" );
    } );

    // Make sure the submit isn't allowed to do anything if disabled.
    paymentButton.click( function( event ) {
        event.preventDefault();

        if ( $( this ).hasClass( "disabled" ) ) {
            return false;
        }

        $( "#card-form" ).submit();
    } );

    function finishTyping( id, value ) {
        var validationValue = value.replace( / /g,'' ),
            cardType = getCardType( validationValue ),
            cardClass = ( cardType != false ) ? "cc-" + cardType : "cc-generic";

        switch( id ) {
            case "cc-number":
                // If the number length is higher than 0, check with valid_credit_card.
                if ( validationValue.length > 0 ) {
                    numberOK = valid_credit_card( validationValue ) && getCardType( validationValue );
                }

                // If the credit card number is valid, move on, otherwise add error class and disable payment button.
                if ( numberOK ) {
                    number.removeClass( "error" );
                    expDate.parent().fadeIn( "fast", function() { expDate.focus(); } );
                } else {
                    number.addClass( "error" );
                }

                // Switch the card icons depending on the type.
                number.parent().attr( "class", cardClass );

                break;
            case "cc-expiration-date":
                // If the string doesn't have any "m" or "y" letters in there, proceed to validation.
                if ( validationValue.indexOf( "m" ) == -1 && validationValue.indexOf( "y" ) == -1 ) {
                    expDateOK = validExpirationDate( validationValue );

                    // If the expiration date is valid, move on, otherwise add error class and disable payment button.
                    if ( expDateOK ) {
                        expDate.removeClass( "error" );
                        cvv.parent().fadeIn( "fast", function() { cvv.focus() } );
                    } else {
                        expDate.addClass( "error" );
                    }
                }

                break;
            case "cc-cvv":
                // Validate it.
                cvvOK = validCVV( validationValue );

                if ( cvvOK ) {
                    cvv.removeClass( "error" );
                    paymentButton.focus();
                } else {
                    cvv.addClass( "error" );
                }

                break;
        }

        // Update the payment button status.
        if ( numberOK && expDateOK && cvvOK ) {
            paymentButton.removeClass( "disabled" );
        } else {
            paymentButton.addClass( "disabled" );
        }
    }
} );
