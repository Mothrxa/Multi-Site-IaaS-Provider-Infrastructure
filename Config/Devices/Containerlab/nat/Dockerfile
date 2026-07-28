FROM alpine:latest
RUN apk add --no-cache nftables iproute2 openssh-server \
    && ssh-keygen -A \
    && mkdir -p /root/.ssh && chmod 700 /root/.ssh
COPY ruleset.nft /etc/nftables.nft
COPY entrypoint.sh /entrypoint.sh
COPY authorized_keys /root/.ssh/authorized_keys
RUN chmod 600 /root/.ssh/authorized_keys && chmod +x /entrypoint.sh \
    && echo "PermitRootLogin prohibit-password" >> /etc/ssh/sshd_config \
    && echo "PasswordAuthentication no" >> /etc/ssh/sshd_config
ENTRYPOINT ["/entrypoint.sh"]