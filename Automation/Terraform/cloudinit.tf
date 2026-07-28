# Configure cloud-init for the VM

locals {
  user_data = <<-EOF
    #cloud-config
    hostname: ${var.vm_hostname}
    users:
      - name: admin
        sudo: ALL=(ALL) NOPASSWD:ALL
        shell: /bin/bash
        ssh_authorized_keys:
          - ${var.ssh_key}
    packages:
      - vim
      - curl
      - wget
      - qemu-guest-agent
    runcmd:
      - [ systemctl, enable, --now, sshd ]
      - [ systemctl, enable, --now, qemu-guest-agent ]
  EOF

  network_config = <<-EOF
    version: 2
    ethernets:
      primary:
        match:
          name: "e*"
        dhcp4: true
  EOF
}

resource "libvirt_cloudinit_disk" "vm_init" {
  name           = "${var.vm_name}-init.iso"
  pool           = var.user_id
  user_data      = local.user_data
  network_config = local.network_config
}
