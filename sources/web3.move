module web3::web3 {
    use std::string::String;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    /// The library store that holds the funds and config.
    public struct Library has key {
        id: UID,
        sui_balance: Balance<SUI>,
        admin: address,
    }

    /// The Access Ticket object that is given to the user.
    public struct AccessTicket has key, store {
        id: UID,
        book_id: String,
    }

    /// Event emitted when a ticket is purchased.
    public struct TicketPurchased has copy, drop {
        ticket_id: ID,
        book_id: String,
        buyer: address,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Library {
            id: object::new(ctx),
            sui_balance: balance::zero(),
            admin: tx_context::sender(ctx),
        });
    }

    /// Buy an access ticket using SUI.
    public fun buy_ticket(
        library: &mut Library,
        payment: Coin<SUI>,
        book_id: String,
        ctx: &mut TxContext
    ): AccessTicket {
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut library.sui_balance, coin_balance);

        let ticket = AccessTicket {
            id: object::new(ctx),
            book_id,
        };

        event::emit(TicketPurchased {
            ticket_id: object::id(&ticket),
            book_id,
            buyer: tx_context::sender(ctx),
        });

        ticket
    }

    /// Admin function to withdraw SUI.
    public fun withdraw_sui(
        library: &mut Library,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == library.admin, 0);
        let coin = coin::take(&mut library.sui_balance, amount, ctx);
        transfer::public_transfer(coin, library.admin);
    }
}
