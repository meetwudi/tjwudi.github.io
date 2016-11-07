+function() {
    /**
     * OneCS: How Passwords Work
     */

    var InteractivePracticeViews = {};

    InteractivePracticeViews.SignUpForm = Backbone.View.extend({
        el: '.J_interactive_sign_up_form',
        events: {
            "submit .J_form": "register"
        },
        template: _.template(`
            <div class="interactive">
                <form class="J_form">
                    <div class="form-group">
                        <label for="inter1-username">用户名</label>
                        <input required type="text" class="form-control" id="inter1-username" placeholder="在此输入你的用户名">
                    </div>
                    <div class="form-group">
                        <label for="inter1-password">密码</label>
                        <input required type="password" class="form-control" id="inter1-password" placeholder="在此输入你的密码">
                    </div>
                    <div>
                        <button class="btn btn-default">提交</button>
                    </div>
                </form>
            </div>
        `),
        initialize: function() {
            this.render();
        },
        render: function() {
            this.$el.html(this.template());
        },
        register: function(evt) {
            evt.preventDefault();
            this.$el.find('.interactive').append(_.template(`<p>恭喜你，注册成功！请继续阅读。</p>`)());
            this.$el.find('button').prop('disabled', true);
        }
    });

    var initViews = function() {
        for (var key in InteractivePracticeViews) {
            new InteractivePracticeViews[key]();
        }
    };
    initViews();

}();
