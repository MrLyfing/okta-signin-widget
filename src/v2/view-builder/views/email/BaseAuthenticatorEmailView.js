import { loc, View, createCallout, _ } from 'okta';
import BaseForm from '../../internals/BaseForm';
import email from '../shared/email';
import polling from '../shared/polling';
import BaseAuthenticatorView from '../../components/BaseAuthenticatorView';
import { SHOW_RESEND_TIMEOUT } from '../../utils/Constants';

const ResendView = View.extend(
  {
    className: 'hide resend-email-view',
    events: {
      'click a.resend-link' : 'handelResendLink'
    },

    initialize () {
      this.add(createCallout({
        content: `${loc('email.code.not.received', 'login')}
        <a class='resend-link'>${loc('email.button.resend', 'login')}</a>`,
        type: 'warning',
      }));
    },

    handelResendLink () {
      this.options.appState.trigger('invokeAction', this.options.resendEmailAction);
      // Hide warning, but reinitiate to show warning again after some threshold of polling
      if (!this.el.classList.contains('hide')) {
        this.el.classList.add('hide');
      }
      this.showCalloutWithDelay();
    },

    postRender () {
      this.showCalloutWithDelay();
    },

    showCalloutWithDelay () {
      this.showMeTimeout = _.delay(() => {
        this.$el.removeClass('hide');
      }, SHOW_RESEND_TIMEOUT);
    },

    remove () {
      View.prototype.remove.apply(this, arguments);
      clearTimeout(this.showMeTimeout);
    }
  },
);

const Body = BaseForm.extend(Object.assign(
  {
    save () {
      return loc('mfa.challenge.verify', 'login');
    },
    initialize () {
      BaseForm.prototype.initialize.apply(this, arguments);

      this.add(ResendView, {
        selector: '.o-form-error-container',
        options: {
          resendEmailAction: this.resendEmailAction,
        }
      });
      this.startPolling();

      // polling has been killed when click save to avoid race conditions hence resume if save failed.
      this.listenTo(this.options.model, 'error', this.startPolling.bind(this));
    },

    saveForm () {
      BaseForm.prototype.saveForm.apply(this, arguments);
      this.stopPolling();
    },

    remove () {
      BaseForm.prototype.remove.apply(this, arguments);
      this.stopPolling();
    }
  },

  email,
  polling,
));

export default BaseAuthenticatorView.extend({
  Body,
});
