variable "user_id"     {}
variable "vm_name"     {}
variable "vm_hostname" {}
variable "vm_cpu"      {}
variable "vm_memory"   {}
variable "vm_size"     {}
variable "os_image"    {}
variable "ssh_key"     {}
terraform {
  required_providers {
    libvirt = {
      source = "dmacvicar/libvirt"
      version = "~> 0.8.0"
    }
  }
}

provider "libvirt" {
  uri = "qemu+ssh://<USER>@<HYPervisor_IP>/system?socket=/run/libvirt/virtqemud-sock"
}

resource "libvirt_domain" "VPS" {
  name         = var.vm_name
  memory       = var.vm_memory
  vcpu         = var.vm_cpu
  qemu_agent   = true
  type         = "kvm"

  cpu {
    mode = "host-passthrough"
  }

  cloudinit = libvirt_cloudinit_disk.vm_init.id
  disk {
    volume_id = libvirt_volume.VPS_disk.id
  }
  network_interface {
    #network_name   = "default"
    #wait_for_lease = true
    bridge = "br-fabric"
  }
  console {
    type        = "pty"
    target_port = "0"
    target_type = "serial"
  }
}

resource "libvirt_volume" "VPS_disk" {
  name             = "${var.vm_name}.qcow2"
  pool             = var.user_id
  base_volume_name = var.os_image
  base_volume_pool = "default"
  size             = var.vm_size * 1073741824
}

output "vm_ip" {
  value = libvirt_domain.VPS.network_interface[0].addresses
}